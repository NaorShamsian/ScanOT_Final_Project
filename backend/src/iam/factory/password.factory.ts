// src/iam/contracts/password.factory.ts
import { validateOrReject } from 'class-validator';
import { PasswordPbkdf2Dto, PasswordEnvelope } from '../dto';
import { HASHING_ALGORITHM } from '../types';
import { ERRORS } from '../../common/types';

export class PasswordFactory {
  public static async fromPlainOrThrow(
    obj: unknown,
  ): Promise<PasswordPbkdf2Dto> {
    const dto = PasswordEnvelope.fromPlain(obj);
    await validateOrReject(dto);
    if (dto.version !== 1 || dto.algorithm !== HASHING_ALGORITHM.PBKDF2) {
      throw new Error(ERRORS.UNSUPPORTED_PASSWORD_RECORD_FORMAT);
    }
    return dto;
  }
}
