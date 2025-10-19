import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import {
  ERRORS,
  IAM_ROUTES,
  INFO,
  PRISMA_ERRORS,
  USERS_ROUTES,
  WARN,
} from './types';
import { IDENTIFIERS } from '../shared';
import { AllExceptionsFilter } from './filters';

@Module({
  providers: [
    {
      provide: IDENTIFIERS.WARN,
      useValue: WARN,
    },
    {
      provide: IDENTIFIERS.INFO,
      useValue: INFO,
    },
    {
      provide: IDENTIFIERS.ERRORS,
      useValue: ERRORS,
    },
    {
      provide: IDENTIFIERS.IAM_ROUTES,
      useValue: IAM_ROUTES,
    },
    {
      provide: IDENTIFIERS.USERS_ROUTES,
      useValue: USERS_ROUTES,
    },
    {
      provide: IDENTIFIERS.PRISMA_ERRORS,
      useValue: PRISMA_ERRORS,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [
    IDENTIFIERS.WARN,
    IDENTIFIERS.INFO,
    IDENTIFIERS.ERRORS,
    IDENTIFIERS.IAM_ROUTES,
    IDENTIFIERS.USERS_ROUTES,
    IDENTIFIERS.PRISMA_ERRORS,
  ],
})
export class CommonModule {}
