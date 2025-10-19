import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IActiveUserData } from '../interfaces';

interface RequestWithUser {
  user: IActiveUserData;
}

export const ActiveUser = createParamDecorator(
  (field: keyof IActiveUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user: IActiveUserData | undefined = request.user;
    return field ? user?.[field] : user;
  },
);
