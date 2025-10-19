import { PickType } from '@nestjs/mapped-types';
import { UserDto } from '../../../users/dto/user.dto';
import { IsDefined } from 'class-validator';

export class SignInDto extends PickType(UserDto, [
  'nickname',
  'password',
] as const) {
  @IsDefined() nickname!: string;
  @IsDefined() password!: string;
}
