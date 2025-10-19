import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { pbkdf2 as pbkdf2Cb, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { PasswordDto, PasswordPbkdf2Dto } from '../../dto';
import { PasswordFactory } from '../../factory';
import {
  ISecurityConfiguration,
  securityConfiguration,
} from '../../../configuration';
import { HashingService } from './hashing.service';
import { ENCODING_ALGORITHM, HASHING_ALGORITHM } from '../../types';
import { IMessageConstant } from '../../../common/types';
import { IDENTIFIERS } from '../../../shared';
const pbkdf2 = promisify(pbkdf2Cb);

@Injectable()
export class Pbkdf2Service implements HashingService {
  constructor(
    @Inject(securityConfiguration.KEY)
    private readonly cfg: ISecurityConfiguration,
    private readonly logger: Logger,
    @Inject(IDENTIFIERS.INFO)
    private readonly info: IMessageConstant,
    @Inject(IDENTIFIERS.ERRORS)
    private readonly errors: IMessageConstant,
  ) {}

  async hash(data: string | Buffer): Promise<PasswordDto> {
    try {
      this.logger.log(this.info.HASHING_DATA, data);
      const salt: Buffer = randomBytes(this.cfg.saltRandomBytes);
      const derived: Buffer = await pbkdf2(
        data,
        salt,
        this.cfg.passwordIterations,
        this.cfg.passwordKeyLength,
        this.cfg.passwordDigest,
      );

      const dto: PasswordPbkdf2Dto = {
        version: 1,
        algorithm: HASHING_ALGORITHM.PBKDF2,
        encoding: ENCODING_ALGORITHM.BASE64,
        salt: salt.toString(ENCODING_ALGORITHM.BASE64),
        hash: derived.toString(ENCODING_ALGORITHM.BASE64),
        passwordIterations: this.cfg.passwordIterations,
        passwordKeyLength: this.cfg.passwordKeyLength,
        passwordDigest: this.cfg.passwordDigest,
      };
      return dto;
    } catch (error) {
      this.logger.error(this.errors.ERROR_HASHING_DATA, error);
      throw new InternalServerErrorException(this.errors.ERROR_HASHING_DATA);
    }
  }

  async verify(data: string | Buffer, stored: PasswordDto): Promise<boolean> {
    try {
      this.logger.log(this.info.VERIFYING_DATA, data);
      const dto: PasswordPbkdf2Dto =
        await PasswordFactory.fromPlainOrThrow(stored);
      const saltBuffer: Buffer = Buffer.from(dto.salt, dto.encoding);
      const expectedHash: Buffer = Buffer.from(dto.hash, dto.encoding);
      const derivedHash: Buffer = await pbkdf2(
        data,
        saltBuffer,
        dto.passwordIterations,
        dto.passwordKeyLength,
        dto.passwordDigest,
      );
      return (
        derivedHash.length === expectedHash.length &&
        timingSafeEqual(derivedHash, expectedHash)
      );
    } catch (error) {
      this.logger.error(this.errors.ERROR_VERIFYING_DATA, error);
      throw new InternalServerErrorException(this.errors.ERROR_VERIFYING_DATA);
    }
  }
}
