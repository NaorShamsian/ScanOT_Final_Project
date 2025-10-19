import { registerAs } from '@nestjs/config';
import { ISecurityConfiguration } from './security.configuration.interface';

const securityConfiguration = registerAs(
  'security',
  function createSecurityConfiguration(): ISecurityConfiguration {
    return {
      authorizationScheme: process.env.AUTHORIZATION_SCHEME || 'Basic',
      minPasswordLength: Number.isInteger(
        Number(process.env.MIN_PASSWORD_LENGTH),
      )
        ? parseInt(process.env.MIN_PASSWORD_LENGTH!, 10)
        : 6,
      passwordIterations: Number.isInteger(
        Number(process.env.PASSWORD_ITERATIONS),
      )
        ? parseInt(process.env.PASSWORD_ITERATIONS!, 10)
        : 10000,
      passwordKeyLength: Number.isInteger(
        Number(process.env.PASSWORD_KEY_LENGTH),
      )
        ? parseInt(process.env.PASSWORD_KEY_LENGTH!, 10)
        : 32,
      saltRandomBytes: Number.isInteger(Number(process.env.SALT_RANDOM_BYTES))
        ? parseInt(process.env.SALT_RANDOM_BYTES!, 10)
        : 16,
      passwordDigest: (process.env.PASSWORD_DIGEST || 'sha256') as
        | 'sha256'
        | 'sha512',
      derivedKeyOutputFormat:
        (process.env.DERIVED_KEY_OUTPUT_FORMAT as BufferEncoding) ||
        ('hex' as BufferEncoding),
      bufferEncoding:
        (process.env.BUFFER_ENCODING as BufferEncoding) ||
        ('base64' as BufferEncoding),
      saltEncoding:
        (process.env.SALT_ENCODING as BufferEncoding) ||
        ('hex' as BufferEncoding),
    };
  },
);

export { securityConfiguration };
