import { IsString, IsOptional, IsArray, IsNumber, IsDateString } from 'class-validator';

export class ScanVulnerabilityDto {
  @IsString()
  id: string;

  @IsString()
  method: string;

  @IsString()
  path: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class ScanPortDto {
  @IsNumber()
  port: number;

  @IsString()
  protocol: string;

  @IsString()
  state: string;

  @IsString()
  service: string;

  @IsOptional()
  @IsString()
  version?: string;
}

export class ScanToolResultDto {
  @IsString()
  target: string;

  @IsString()
  ip: string;

  @IsOptional()
  @IsString()
  port?: string;

  @IsOptional()
  @IsArray()
  vulnerabilities?: ScanVulnerabilityDto[];

  @IsOptional()
  @IsArray()
  ports?: ScanPortDto[];

  @IsOptional()
  @IsArray()
  findings?: ScanVulnerabilityDto[];
}

export class ScanSummarySummaryDto {
  @IsNumber()
  totalVulnerabilities: number;

  @IsNumber()
  openPorts: number;

  @IsNumber()
  criticalFindings: number;

  @IsNumber()
  highFindings: number;

  @IsNumber()
  mediumFindings: number;

  @IsNumber()
  lowFindings: number;

  @IsNumber()
  totalCredentials: number;

  @IsNumber()
  totalDirectories: number;
}

export class ScanSummaryDto {
  @IsString()
  target: string;

  @IsString()
  ip: string;

  @IsDateString()
  scanDate: string;

  @IsOptional()
  nikto?: ScanToolResultDto;

  @IsOptional()
  nmap?: ScanToolResultDto;

  @IsOptional()
  nuclei?: ScanToolResultDto;

  @IsOptional()
  hydra?: ScanToolResultDto;

  @IsOptional()
  gobuster?: ScanToolResultDto;

  @IsOptional()
  sqlmap?: ScanToolResultDto;

  @IsOptional()
  summary?: ScanSummarySummaryDto;
}

export class ScanListDto {
  @IsArray()
  scans: ScanSummaryDto[];

  @IsNumber()
  total: number;

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;
}

export class ScanFiltersDto {
  @IsOptional()
  @IsString()
  target?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  tool?: string;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}
