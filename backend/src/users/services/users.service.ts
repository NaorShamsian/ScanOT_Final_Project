import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { UpdateUserDto } from '../dto/update-user.dto';
import { HashingService } from '../../iam/hashing';
import { asPasswordDto } from '../../iam/dto';
import { PrismaService } from '../../prisma';
import { Prisma } from '@prisma/client';
import { IMessageConstant } from '../../common/types';
import { IDENTIFIERS } from '../../shared';
import { UserDto } from '../dto/user.dto';
import { SignUpDto } from '../../iam/authentication/dto/sign-up.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(HashingService)
    private readonly hashingService: HashingService,
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    @Inject(IDENTIFIERS.INFO)
    private readonly info: IMessageConstant,
    @Inject(IDENTIFIERS.ERRORS)
    private readonly errors: IMessageConstant,
  ) {}

  public async create(signUpDto: SignUpDto) {
    try {
      this.logger.log(this.info.CREATING_USER, signUpDto);
      const pwd = await this.hashingService.hash(signUpDto.password);
      await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            firstName: signUpDto.firstName,
            lastName: signUpDto.lastName,
            nickname: signUpDto.nickname,
          },
        });
        const credential = await tx.credential.create({
          data: {
            userId: user.id,
            password: pwd as unknown as Prisma.InputJsonValue,
          },
        });
        await tx.user.update({
          where: { id: user.id },
          data: { credential: { connect: { id: credential.id } } },
        });
      });
    } catch (error) {
      this.logger.error(this.errors.ERROR_CREATING_USER, error);
      throw new InternalServerErrorException(this.errors.ERROR_CREATING_USER);
    }
  }

  public async findAll() {
    try {
      this.logger.log(this.info.FINDING_ALL_USERS);
      return await this.prisma.user.findMany();
    } catch (error) {
      this.logger.error(this.errors.ERROR_FINDING_ALL_USERS, error);
      throw new InternalServerErrorException(
        this.errors.ERROR_FINDING_ALL_USERS,
      );
    }
  }

  public async findAllPaginated(page: number = 1, limit: number = 10) {
    try {
      this.logger.log(this.info.FINDING_ALL_USERS_PAGINATED, { page, limit });

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            nickname: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.user.count(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(this.errors.ERROR_FINDING_ALL_USERS_PAGINATED, error);
      throw new InternalServerErrorException(
        this.errors.ERROR_FINDING_ALL_USERS_PAGINATED,
      );
    }
  }

  public async findOne(id: string) {
    try {
      this.logger.log(this.info.FINDING_USER, { userId: id });
      return await this.prisma.user.findUnique({ where: { id } });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.errors.ERROR_FINDING_USER, {
        userId: id,
        error: errorMessage,
      });
      throw new InternalServerErrorException(this.errors.ERROR_FINDING_USER);
    }
  }

  public async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      this.logger.log(this.info.UPDATING_USER, {
        userId: id,
        updateData: updateUserDto,
      });
      await this.prisma.user.update({ where: { id }, data: updateUserDto });
      if (updateUserDto.password) {
        await this.updatePassword(id, updateUserDto.password);
      }
      return { message: this.info.USER_UPDATED };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.errors.ERROR_UPDATING_USER, {
        userId: id,
        error: errorMessage,
      });
      throw new InternalServerErrorException(this.errors.ERROR_UPDATING_USER);
    }
  }

  public async verify(nickname: string, input: string) {
    try {
      this.logger.log(this.info.VERIFYING_USER, nickname);
      const user = await this.prisma.user.findUnique({
        where: { nickname },
        include: { credential: true },
      });
      if (!user?.credential) return false;

      return this.hashingService.verify(
        input,
        asPasswordDto(user.credential.password),
      );
    } catch (error) {
      this.logger.error(this.errors.ERROR_VERIFYING_USER, error);
      throw new InternalServerErrorException(this.errors.ERROR_VERIFYING_USER);
    }
  }

  public async remove(userId: string) {
    try {
      this.logger.log(this.info.REMOVING_USER, userId);
      await this.prisma.$transaction(async (tx) => {
        await tx.credential.deleteMany({ where: { userId } });
        await tx.user.delete({ where: { id: userId } });
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.errors.ERROR_REMOVING_USER, {
        userId,
        error: errorMessage,
      });
      throw new InternalServerErrorException(this.errors.ERROR_REMOVING_USER);
    }
  }

  private async updatePassword(userId: string, newPassword: string) {
    try {
      this.logger.log(this.info.UPDATING_USER_PASSWORD, { userId });
      const hashedPassword = await this.hashingService.hash(newPassword);

      await this.prisma.$transaction(async (tx) => {
        await tx.credential.deleteMany({ where: { userId } });
        const newCredential = await tx.credential.create({
          data: {
            userId,
            password: hashedPassword as unknown as Prisma.InputJsonValue,
          },
        });
        await tx.user.update({
          where: { id: userId },
          data: { credential: { connect: { id: newCredential.id } } },
        });
      });

      return { message: this.info.USER_UPDATED_PASSWORD };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(this.errors.ERROR_UPDATING_USER_PASSWORD, {
        userId,
        error: errorMessage,
      });
      throw new InternalServerErrorException(
        this.errors.ERROR_UPDATING_USER_PASSWORD,
      );
    }
  }
}
