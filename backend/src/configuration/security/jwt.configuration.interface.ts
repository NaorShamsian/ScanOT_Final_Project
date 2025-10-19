export interface IJwtConfiguration {
  jwtSecret: string;
  jwtAccessTokenTtl: number;
  jwtRefreshSecret: string;
  jwtRefreshExpirationTime: number;
  jwtTokenAudience: string;
  jwtTokenIssuer: string;
  jwtRefreshTokenTtl: number;
}
