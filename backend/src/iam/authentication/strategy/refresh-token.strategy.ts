import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { IJwtConfiguration, jwtConfiguration } from '../../../configuration';

interface RequestWithCookies extends Request {
  cookies: {
    refresh_token?: string;
  };
}

function refreshTokenExtractor(req: Request): string | null {
  if (!req) return null;
  const requestWithCookies = req as RequestWithCookies;
  return requestWithCookies.cookies?.refresh_token ?? null;
}

interface RefreshTokenPayload {
  sub: string;
  refreshTokenId: string;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh-token',
) {
  constructor(
    @Inject(jwtConfiguration.KEY)
    private readonly jwtConfig: IJwtConfiguration,
  ) {
    const extractor = ExtractJwt.fromExtractors([refreshTokenExtractor]);
    super({
      jwtFromRequest: extractor,
      secretOrKey: jwtConfig.jwtSecret,
      ignoreExpiration: false,
      audience: jwtConfig.jwtTokenAudience,
      issuer: jwtConfig.jwtTokenIssuer,
    });
  }

  async validate(payload: RefreshTokenPayload): Promise<{ sub: string }> {
    // Validate payload synchronously
    return await Promise.resolve({ sub: payload.sub });
  }
}
