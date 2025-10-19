import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy } from 'passport-http';
import { PrismaService } from '../../../prisma';
import { HashingService } from '../../hashing';
import { asPasswordDto } from '../../dto';
import { Logger } from 'nestjs-pino';
import { IMessageConstant } from '../../../common/types';
import { IDENTIFIERS } from '../../../shared';
import { Prisma } from '@prisma/client';

interface AuthenticatedUser {
  userId: string;
  nickname: string;
  firstName: string;
  lastName: string;
}

type TUserWithCredential = {
  id: string;
  nickname: string;
  firstName: string;
  lastName: string;
  credential: {
    id: string;
    password: Prisma.JsonValue;
  } | null;
};

@Injectable()
export class BasicAuthStrategy extends PassportStrategy(BasicStrategy) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingService: HashingService,
    private readonly logger: Logger,
    @Inject(IDENTIFIERS.WARN)
    private readonly warn: IMessageConstant,
    @Inject(IDENTIFIERS.INFO)
    private readonly info: IMessageConstant,
    @Inject(IDENTIFIERS.ERRORS)
    private readonly errors: IMessageConstant,
  ) {
    super({
      passReqToCallback: false,
    });
  }

  async validate(
    nickname: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    try {
      this.logger.log(this.info.VALIDATING_CREDENTIALS, nickname);
      const user = (await this.prisma.user.findUnique({
        where: { nickname },
        include: { credential: true },
      })) as TUserWithCredential | null;
      if (!user || !user.credential) {
        throw new UnauthorizedException(this.warn.USER_WRONG_CREDENTIALS);
      }
      const isPasswordValid = await this.hashingService.verify(
        password,
        asPasswordDto(user.credential.password),
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException(this.warn.USER_WRONG_CREDENTIALS);
      }
      return {
        userId: user.id,
        nickname: user.nickname,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    } catch (error) {
      this.logger.error(this.errors.ERROR_VALIDATING_CREDENTIALS, error);
      throw new UnauthorizedException(this.warn.USER_WRONG_CREDENTIALS);
    }
  }
}
