export interface ISecurityConfiguration {
  authorizationScheme: string;
  minPasswordLength: number;
  passwordIterations: number;
  passwordKeyLength: number;
  passwordDigest: 'sha256' | 'sha512';
  derivedKeyOutputFormat: BufferEncoding;
  bufferEncoding: BufferEncoding;
  saltRandomBytes: number;
  saltEncoding: BufferEncoding;
}
