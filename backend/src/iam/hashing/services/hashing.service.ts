import { Injectable } from '@nestjs/common';
import { PasswordDto } from '../../dto';

@Injectable()
export abstract class HashingService {
  abstract hash(data: string | Buffer): Promise<PasswordDto>;
  abstract verify(data: string | Buffer, stored: PasswordDto): Promise<boolean>;
}
