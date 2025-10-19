import { PaginationDto } from './pagination.dto';
import { UserResponseDto } from './user-response.dto';

export class PaginatedUsersDto {
  data: UserResponseDto[];
  pagination: PaginationDto;
}
