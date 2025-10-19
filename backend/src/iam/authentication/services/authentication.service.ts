import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { HashingService } from '../../hashing';
import { PrismaService } from '../../../prisma';
import { SignUpDto } from '../dto/sign-up.dto';
import { SignInDto } from '../dto/sign-in.dto';
import { asPasswordDto } from '../../dto';
import { Prisma } from '@prisma/client';
import { Logger } from 'nestjs-pino';
import { IMessageConstant } from '../../../common/types';
import { IDENTIFIERS } from '../../../shared';
import { JwtService } from '@nestjs/jwt';
import { IJwtConfiguration, jwtConfiguration } from '../../../configuration';
import { IActiveUserData } from '../../interfaces';
import { Response } from 'express';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { IRedisService } from '../../../redis';
import { randomUUID } from 'crypto';
import { WrongRefreshTokenError } from '../../../redis/error';

// Типы для Prisma результатов
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

type TUser = {
  id: string;
  nickname: string;
  firstName: string;
  lastName: string;
};

type TUserBasic = {
  id: string;
  nickname: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingService: HashingService,
    @Inject(IDENTIFIERS.REDIS_SERVICE)
    private readonly redisService: IRedisService,
    private readonly logger: Logger,
    @Inject(IDENTIFIERS.INFO)
    private readonly info: IMessageConstant,
    @Inject(IDENTIFIERS.ERRORS)
    private readonly errors: IMessageConstant,
    @Inject(IDENTIFIERS.WARN)
    private readonly warn: IMessageConstant,
    private readonly jwtService: JwtService,
    @Inject(jwtConfiguration.KEY)
    private readonly jwtConfig: IJwtConfiguration,
  ) {}

  public async signUp(dto: SignUpDto): Promise<TUser> {
    try {
      this.logger.log(this.info.SIGNING_UP, dto);
      const user = await this.prisma.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          nickname: dto.nickname,
          credential: {
            create: {
              password: (await this.hashingService.hash(
                dto.password,
              )) as unknown as Prisma.InputJsonValue,
            },
          },
        },
      });

      this.logger.log(this.info.USER_CREATED, {
        userId: user.id,
        nickname: user.nickname,
      });
      return user;
    } catch (error) {
      this.logger.error(this.errors.ERROR_SIGNING_UP, error);
      throw error;
    }
  }

  public async signIn(dto: SignInDto, response: Response): Promise<TUser> {
    try {
      this.logger.log(this.info.SIGNING_IN, dto);
      const user = (await this.prisma.user.findUnique({
        where: { nickname: dto.nickname },
        include: { credential: true },
      })) as TUserWithCredential | null;

      if (!user) {
        throw new UnauthorizedException(this.warn.USER_NOT_FOUND);
      }

      if (!user.credential) {
        throw new UnauthorizedException(this.warn.USER_WRONG_CREDENTIALS);
      }

      const isPasswordValid = await this.hashingService.verify(
        dto.password,
        asPasswordDto(user.credential.password),
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException(this.warn.USER_WRONG_CREDENTIALS);
      }
      this.logger.log(this.info.GENERATING_ACCESS_TOKEN);
      const [accessToken, refreshToken] = await this.generateTokens({
        id: user.id,
        nickname: user.nickname,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      this.setAuthCookies(response, accessToken, refreshToken);

      this.logger.log(this.info.ACCESS_TOKEN_GENERATED);
      this.logger.log(this.info.USER_FOUND, {
        userId: user.id,
        nickname: user.nickname,
      });
      return {
        id: user.id,
        nickname: user.nickname,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    } catch (error) {
      this.logger.error(this.errors.ERROR_SIGNING_IN, error);
      throw error;
    }
  }
  public async signOut(
    response: Response,
    accessToken?: string,
    refreshToken?: string,
  ) {
    try {
      this.logger.log(this.info.SIGNING_OUT);
      if (accessToken) {
        try {
          const decoded = this.jwtService.decode(accessToken);
          if (decoded && decoded.jti && decoded.sub) {
            await this.redisService.invalidate(decoded.sub);
            this.logger.log(this.info.ACCESS_TOKEN_ADDED_TO_BLACKLIST, {
              jti: decoded.jti,
            });
          }
        } catch (error) {
          this.logger.warn(
            this.warn.FAILED_TO_DECODE_ACCESS_TOKEN_FOR_BLACKLIST,
            error,
          );
        }
      }

      if (refreshToken) {
        try {
          const decoded = this.jwtService.decode(refreshToken);
          if (decoded && decoded.jti && decoded.sub) {
            await this.redisService.invalidate(decoded.sub);
            this.logger.log(this.info.REFRESH_TOKEN_ADDED_TO_BLACKLIST, {
              jti: decoded.jti,
            });
          }
        } catch (error) {
          this.logger.warn(this.errors.ERROR_INVALIDATING_REFRESH_TOKEN, error);
        }
      }
      response.clearCookie('access_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });

      response.clearCookie('refresh_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });

      this.logger.log(this.info.SUCCESSFULLY_SIGNED_OUT);
      return { message: this.info.SUCCESSFULLY_SIGNED_OUT };
    } catch (error) {
      this.logger.error(this.errors.ERROR_SIGNING_OUT, error);
      throw error;
    }
  }

  public async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    response: Response,
  ) {
    try {
      this.logger.log(this.info.REFRESHING_TOKEN);
      if (!refreshTokenDto.refreshToken) {
        throw new UnauthorizedException(this.warn.REFRESH_TOKEN_REQUIRED);
      }

      const { sub, refreshTokenId } = await this.jwtService.verifyAsync<
        Pick<IActiveUserData, 'sub'> & { refreshTokenId: string }
      >(refreshTokenDto.refreshToken, {
        audience: this.jwtConfig.jwtTokenAudience,
        issuer: this.jwtConfig.jwtTokenIssuer,
        secret: this.jwtConfig.jwtSecret,
      });
      if (!sub) {
        throw new UnauthorizedException(this.warn.USER_NOT_FOUND);
      }
      const user = await this.prisma.user.findUnique({
        where: { id: sub },
      });
      if (!user) {
        throw new UnauthorizedException(this.warn.USER_NOT_FOUND);
      }
      await this.redisService.validate(sub, refreshTokenId);
      return await this.refreshTokenByUserId(sub, response);
    } catch (error) {
      if (error instanceof WrongRefreshTokenError) {
        this.logger.error(this.errors.EXPIRED_REFRESH_TOKEN);
        throw new UnauthorizedException(this.errors.EXPIRED_REFRESH_TOKEN);
      }
      this.logger.error(this.errors.ERROR_REFRESHING_TOKEN, error);
      throw error;
    }
  }

  public async refreshTokenByUserId(userId: string, response: Response) {
    try {
      this.logger.log(this.info.REFRESHING_TOKEN);
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new UnauthorizedException(this.warn.USER_NOT_FOUND);
      }
      const [accessToken, refreshToken] = await this.generateTokens({
        id: user.id,
        nickname: user.nickname,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      this.setAuthCookies(response, accessToken, refreshToken);

      return {
        message: this.info.TOKENS_REFRESHED_SUCCESSFULLY,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error(this.errors.ERROR_REFRESHING_TOKEN, error);
      throw error;
    }
  }

  public async generateTokens(user: TUserBasic): Promise<[string, string]> {
    try {
      this.logger.log(this.info.GENERATING_TOKENS);
      const refreshTokenId = randomUUID();
      const [accessToken, refreshToken] = await Promise.all([
        this.signToken<Partial<IActiveUserData>>(
          user.id,
          this.jwtConfig.jwtAccessTokenTtl,
          { nickname: user.nickname },
        ),
        this.signToken(user.id, this.jwtConfig.jwtRefreshTokenTtl, {
          refreshTokenId,
        }),
      ]);

      await this.writeAuthTokensToRedis(user.id, accessToken, refreshToken);

      return [accessToken, refreshToken];
    } catch (error) {
      this.logger.error(this.errors.ERROR_GENERATING_TOKENS, error);
      throw error;
    }
  }
  private async signToken<T>(userId: string, expiresIn: number, payload?: T) {
    try {
      this.logger.log(this.info.SIGNING_TOKEN);
      return await this.jwtService.signAsync(
        {
          sub: userId,
          ...payload,
        } as unknown as IActiveUserData,
        {
          audience: this.jwtConfig.jwtTokenAudience,
          issuer: this.jwtConfig.jwtTokenIssuer,
          secret: this.jwtConfig.jwtSecret,
          expiresIn: expiresIn,
        },
      );
    } catch (error) {
      this.logger.error(this.errors.ERROR_SIGNING_TOKEN, error);
      throw error;
    }
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    try {
      this.logger.log(this.info.SETTING_AUTH_COOKIES);
      response.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: this.jwtConfig.jwtAccessTokenTtl * 1000,
        path: '/',
      });

      response.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: this.jwtConfig.jwtRefreshTokenTtl * 1000,
        path: '/',
      });
    } catch (error) {
      this.logger.error(this.errors.ERROR_SETTING_AUTH_COOKIES, error);
      throw error;
    }
  }

  private async writeAuthTokensToRedis(
    userId: string,
    accessToken: string,
    refreshToken: string,
  ) {
    try {
      this.logger.log(this.info.ADDING_AUTH_TOKENS_TO_REDIS);
      this.logger.log(
        `Writing access token for user ${userId}, token length: ${accessToken.length}`,
      );
      await this.redisService.insert(`access:${userId}`, accessToken);
      this.logger.log(
        `Writing refresh token for user ${userId}, token length: ${refreshToken.length}`,
      );
      await this.redisService.insert(`refresh:${userId}`, refreshToken);
      this.logger.log(this.info.AUTH_TOKENS_ADDED_TO_REDIS);
    } catch (error) {
      this.logger.error(this.errors.ERROR_WRITING_AUTH_TOKENS_TO_REDIS, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error details:', {
        userId,
        accessTokenLength: accessToken?.length,
        refreshTokenLength: refreshToken?.length,
        error: errorMessage,
      });
      throw error;
    }
  }
}
