import { registerAs } from '@nestjs/config';
import { IJwtConfiguration } from './jwt.configuration.interface';

const jwtConfiguration = registerAs(
  'jwt',
  function createJwtConfiguration(): IJwtConfiguration {
    return {
      jwtSecret: process.env.JWT_SECRET || 'YOUR_SECRET_KEY_HERE',
      jwtAccessTokenTtl: Number.isInteger(
        Number(process.env.JWT_ACCESS_TOKEN_TTL),
      )
        ? parseInt(process.env.JWT_ACCESS_TOKEN_TTL!, 10)
        : 3600,
      jwtRefreshSecret:
        process.env.JWT_REFRESH_SECRET || 'YOUR_REFRESH_SECRET_KEY_HERE',
      jwtRefreshExpirationTime: Number.isInteger(
        Number(process.env.JWT_REFRESH_EXPIRATION_TIME),
      )
        ? parseInt(process.env.JWT_REFRESH_EXPIRATION_TIME!, 10)
        : 86400,
      jwtTokenAudience: process.env.JWT_TOKEN_AUDIENCE || 'foxminded',
      jwtTokenIssuer: process.env.JWT_TOKEN_ISSUER || 'foxminded',
      jwtRefreshTokenTtl: Number.isInteger(
        Number(process.env.JWT_REFRESH_TOKEN_TTL),
      )
        ? parseInt(process.env.JWT_REFRESH_TOKEN_TTL!, 10)
        : 86400,
    };
  },
);
export { jwtConfiguration };
