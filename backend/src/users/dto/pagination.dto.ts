import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  total?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  totalPages?: number;

  @IsOptional()
  @Type(() => Boolean)
  hasNext?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  hasPrev?: boolean;
}
