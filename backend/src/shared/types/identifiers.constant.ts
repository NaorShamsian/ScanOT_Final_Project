import { IMessageConstant } from 'src/common';

export const IDENTIFIERS: IMessageConstant = {
  INFO: 'INFO',
  ERRORS: 'ERRORS',
  WARN: 'WARN',
  IAM_ROUTES: 'IAM_ROUTES',
  USERS_ROUTES: 'USERS_ROUTES',
  PRISMA_ERRORS: 'PRISMA_ERRORS',
  REDIS_CLIENT: 'REDIS_CLIENT',
  REDIS_SERVICE: 'REDIS_SERVICE',
} as const;
