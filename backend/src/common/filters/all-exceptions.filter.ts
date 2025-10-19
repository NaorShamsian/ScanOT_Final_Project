import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ERRORS } from '../types/log/errors.constant';
import { PRISMA_ERRORS } from '../types/prisma';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = ERRORS.INTERNAL_SERVER_ERROR;
    let error: string | object = ERRORS.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      error = exception.getResponse();
    } else if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case PRISMA_ERRORS.UNIQUE_CONSTRAINT_VIOLATION:
          status = HttpStatus.CONFLICT;
          message = ERRORS.RESOURCE_ALREADY_EXISTS;
          error = ERRORS.UNIQUE_CONSTRAINT_VIOLATION;
          break;
        case PRISMA_ERRORS.RECORD_NOT_FOUND:
          status = HttpStatus.NOT_FOUND;
          message = ERRORS.RECORD_NOT_FOUND;
          error = ERRORS.RECORD_NOT_FOUND;
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = ERRORS.DATABASE_OPERATION_FAILED;
          error = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.stack || exception.message;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error,
    };

    response.status(status).send(errorResponse);
  }
}
