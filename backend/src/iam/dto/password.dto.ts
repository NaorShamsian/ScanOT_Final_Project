import { IsIn, IsInt, IsString, Min, IsBase64 } from 'class-validator';
import { Expose } from 'class-transformer';
import { ENCODING_ALGORITHM, HASHING_ALGORITHM } from '../types';

export class PasswordDto {
  @Expose()
  @IsInt()
  @Min(1)
  version!: 1;

  @Expose()
  @IsIn(Object.values(HASHING_ALGORITHM))
  algorithm!: typeof HASHING_ALGORITHM.PBKDF2;

  @Expose()
  @IsIn(Object.values(ENCODING_ALGORITHM))
  encoding!: typeof ENCODING_ALGORITHM.BASE64 | typeof ENCODING_ALGORITHM.HEX;

  @Expose()
  @IsString()
  @IsBase64()
  salt: string;

  @Expose()
  @IsString()
  @IsBase64()
  hash!: string;
}
