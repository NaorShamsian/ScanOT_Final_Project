// auth/jwt.strategy.ts
import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { IJwtConfiguration, jwtConfiguration } from '../../../configuration';

interface RequestWithCookies extends Request {
  cookies: {
    access_token?: string;
  };
}

function cookieExtractor(req: Request): string | null {
  if (!req) return null;
  const requestWithCookies = req as RequestWithCookies;
  return requestWithCookies.cookies?.access_token ?? null;
}

interface JwtPayload {
  sub: string;
  nickname: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(jwtConfiguration.KEY)
    private readonly jwtConfig: IJwtConfiguration,
  ) {
    const extractor = ExtractJwt.fromExtractors([cookieExtractor]);
    super({
      jwtFromRequest: extractor,
      secretOrKey: jwtConfig.jwtSecret,
      ignoreExpiration: false,
      audience: jwtConfig.jwtTokenAudience,
      issuer: jwtConfig.jwtTokenIssuer,
    });
  }

  async validate(
    payload: JwtPayload,
  ): Promise<{ sub: string; nickname: string }> {
    // Validate payload synchronously
    return await Promise.resolve({
      sub: payload.sub,
      nickname: payload.nickname,
    });
  }
}
