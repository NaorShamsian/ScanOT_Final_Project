import { IsIn, Min } from 'class-validator';

import { Expose } from 'class-transformer';
import { IsInt } from 'class-validator';
import { PasswordDto } from './password.dto';
import { DIGEST_ALGORITHM } from '../types';

export class PasswordPbkdf2Dto extends PasswordDto {
  @Expose()
  @IsInt()
  @Min(1)
  passwordIterations!: number;

  @Expose()
  @IsInt()
  @Min(16)
  passwordKeyLength!: number;

  @Expose()
  @IsIn(Object.values(DIGEST_ALGORITHM))
  passwordDigest!:
    | typeof DIGEST_ALGORITHM.SHA256
    | typeof DIGEST_ALGORITHM.SHA512;
}
