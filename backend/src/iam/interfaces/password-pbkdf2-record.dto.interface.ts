import { DIGEST_ALGORITHM, HASHING_ALGORITHM } from '../types';
import { IPassword } from './password.interface';

export interface IPasswordPbkdf2RecordDto extends IPassword {
  readonly algorithm: typeof HASHING_ALGORITHM.PBKDF2;
  readonly passwordIterations: number;
  readonly passwordKeyLength: number;
  readonly passwordDigest:
    | typeof DIGEST_ALGORITHM.SHA256
    | typeof DIGEST_ALGORITHM.SHA512;
}
