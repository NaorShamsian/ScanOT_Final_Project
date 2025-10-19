// auth/jwt.guard.ts
import {
  Injectable,
  ExecutionContext,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ERRORS } from '../../../common/types';
import { RedisService } from '../../../redis/services/redis.service';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

interface JwtPayload {
  sub: string;
  nickname: string;
  jti: string;
}

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly redisService: RedisService,
    private readonly logger: Logger,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser extends JwtPayload = JwtPayload>(
    err: unknown,
    user: TUser | null,
  ): TUser {
    if (err || !user) {
      throw new UnauthorizedException(ERRORS.WRONG_OR_EXPIRED_TOKEN);
    }

    if (user.jti) {
      Promise.resolve()
        .then(async () => {
          const isBlacklisted = await this.redisService.validate(
            user.sub,
            user.jti,
          );
          if (isBlacklisted) {
            throw new UnauthorizedException(ERRORS.WRONG_OR_EXPIRED_TOKEN);
          }
        })
        .catch((error) => {
          this.logger.error('Error validating refresh token', error);
        });
    }

    return user;
  }
}
