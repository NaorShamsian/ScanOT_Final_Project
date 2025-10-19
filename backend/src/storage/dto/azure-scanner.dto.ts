import { IsString, IsIP, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class StartScanDto {
  @IsNotEmpty({ message: 'Target is required' })
  @IsString({ message: 'Target must be a string' })
  @IsIP(4, { message: 'Target must be a valid IPv4 address' })
  target: string;
}

export class AzureScannerConfigDto {
  @IsOptional()
  @IsString({ message: 'Base URL must be a string' })
  baseUrl?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Timeout must be a number' })
  @Min(1000, { message: 'Timeout must be at least 1000ms' })
  @Max(120000, { message: 'Timeout must not exceed 120000ms' })
  timeout?: number;
}
