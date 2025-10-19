import { PickType } from '@nestjs/mapped-types';
import { UserDto } from '../../../users/dto/user.dto';
import { IsDefined } from 'class-validator';

export class SignUpDto extends PickType(UserDto, [
  'nickname',
  'firstName',
  'lastName',
  'password',
] as const) {
  @IsDefined() nickname!: string;
  @IsDefined() firstName!: string;
  @IsDefined() lastName!: string;
  @IsDefined() password!: string;
}
