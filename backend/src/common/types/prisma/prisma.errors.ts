import { IMessageConstant } from '../log';

export const PRISMA_ERRORS: IMessageConstant = {
  UNIQUE_CONSTRAINT_VIOLATION: 'P2002',
  RECORD_NOT_FOUND: 'P2025',
  DATABASE_OPERATION_FAILED: 'P2000',
} as const;
