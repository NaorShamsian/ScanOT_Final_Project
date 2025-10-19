import { Type, plainToInstance } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { PasswordPbkdf2Dto } from './password-pbkdf2.dto';
import { ERRORS } from '../../common/types';

export class PasswordEnvelope {
  @ValidateNested()
  @Type(() => PasswordPbkdf2Dto)
  record!: PasswordPbkdf2Dto;

  public static fromPlain(obj: unknown): PasswordPbkdf2Dto {
    try {
      return plainToInstance(PasswordPbkdf2Dto, obj, {
        exposeDefaultValues: false,
        enableImplicitConversion: false,
      });
    } catch {
      throw new Error(ERRORS.WRONG_PASSWORD_JSON);
    }
  }
}
