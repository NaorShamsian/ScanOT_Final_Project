import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { UserDto } from './user.dto';

export class UserResponseDto extends PartialType(
  PickType(UserDto, ['nickname', 'firstName', 'lastName'] as const),
) {
  @IsString()
  id!: string;

  @IsString()
  createdAt!: string;

  @IsString()
  updatedAt!: string;
}
