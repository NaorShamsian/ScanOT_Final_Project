import { Prisma } from '@prisma/client';
import { PasswordDto } from './password.dto';
import { ERRORS } from '../../common/types';

export function asPasswordDto(json: Prisma.JsonValue): PasswordDto {
  if (!json || typeof json !== 'object') {
    throw new Error(ERRORS.WRONG_PASSWORD_JSON);
  }
  const obj = json as Record<string, unknown>;
  return obj as unknown as PasswordDto;
}
