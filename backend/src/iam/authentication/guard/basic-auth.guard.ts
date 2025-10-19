import {
  Inject,
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IMessageConstant } from '../../../common/types';
import { IDENTIFIERS } from '../../../shared';

interface AuthenticatedUser {
  userId: string;
  nickname: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class BasicAuthGuard extends AuthGuard('basic') {
  constructor(
    private reflector: Reflector,
    @Inject(IDENTIFIERS.WARN)
    private readonly warn: IMessageConstant,
  ) {
    super();
  }

  public canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  public handleRequest<TUser = AuthenticatedUser>(
    err: unknown,
    user: TUser | null,
  ): TUser {
    if (err || !user) {
      throw new UnauthorizedException(this.warn.AUTHENTICATION_REQUIRED);
    }
    return user;
  }
}
