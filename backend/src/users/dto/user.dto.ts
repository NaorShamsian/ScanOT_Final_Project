import { IsString, MaxLength, MinLength } from 'class-validator';

export class UserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  nickname!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(16)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(16)
  lastName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(16)
  password!: string;
}
