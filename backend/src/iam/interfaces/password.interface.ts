import { ENCODING_ALGORITHM } from '../types';

export interface IPassword {
  readonly version: 1;
  readonly algorithm: string;
  readonly encoding:
    | typeof ENCODING_ALGORITHM.BASE64
    | typeof ENCODING_ALGORITHM.HEX;
  readonly salt: string;
  readonly hash: string;
}
