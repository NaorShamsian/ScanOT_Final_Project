import { FastifyRequest } from 'fastify';

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: string;
    nickname: string;
    firstName: string;
    lastName: string;
  };
}
