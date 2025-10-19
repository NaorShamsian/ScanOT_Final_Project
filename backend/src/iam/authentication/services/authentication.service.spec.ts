import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { PrismaService } from '../../../prisma';
import { HashingService } from '../../hashing';
import { RedisService } from '../../../redis/services/redis.service';
import { Logger } from 'nestjs-pino';
import { JwtService } from '@nestjs/jwt';
import { IDENTIFIERS } from '../../../shared';
import { jwtConfiguration } from '../../../configuration';
import { Response } from 'express';

interface MockResponse {
  clearCookie: jest.Mock;
  req?: {
    cookies?: {
      access_token?: string;
      refresh_token?: string;
    };
  };
}

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let mockRedisService: jest.Mocked<RedisService>;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const mockHashing = {
      hash: jest.fn(),
      verify: jest.fn(),
    };

    const mockRedis = {
      setJwtBlacklist: jest.fn(),
      setRefreshTokenBlacklist: jest.fn(),
      invalidate: jest.fn(),
    };

    const mockJwt = {
      signAsync: jest.fn(),
      decode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: HashingService,
          useValue: mockHashing,
        },
        {
          provide: IDENTIFIERS.REDIS_SERVICE,
          useValue: mockRedis,
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: mockJwt,
        },
        {
          provide: IDENTIFIERS.INFO,
          useValue: {
            SIGNING_UP: 'Signing up',
            USER_CREATED: 'User created',
            SIGNING_IN: 'Signing in',
            GENERATING_ACCESS_TOKEN: 'Generating access token',
            ACCESS_TOKEN_GENERATED: 'Access token generated',
            USER_FOUND: 'User found',
            SUCCESSFULLY_SIGNED_IN: 'Successfully signed in',
            SUCCESSFULLY_SIGNED_OUT: 'Successfully signed out',
            REQUEST_TO_SIGN_UP: 'Request to sign up',
            REQUEST_TO_SIGN_IN: 'Request to sign in',
            REQUEST_TO_SIGN_OUT: 'Request to sign out',
            ACCESS_TOKEN_ADDED_TO_BLACKLIST: 'Access token added to blacklist',
            REFRESH_TOKEN_ADDED_TO_BLACKLIST:
              'Refresh token added to blacklist',
            SIGNING_OUT: 'Signing out',
          },
        },
        {
          provide: IDENTIFIERS.ERRORS,
          useValue: {
            ERROR_SIGNING_UP: 'Error signing up',
            ERROR_SIGNING_IN: 'Error signing in',
            ERROR_SIGNING_OUT: 'Error signing out',
            ERROR_INVALIDATING_REFRESH_TOKEN:
              'Error invalidating refresh token',
          },
        },
        {
          provide: IDENTIFIERS.WARN,
          useValue: {
            USER_NOT_FOUND: 'User not found',
            USER_WRONG_CREDENTIALS: 'Wrong credentials',
            FAILED_TO_DECODE_ACCESS_TOKEN_FOR_BLACKLIST:
              'Failed to decode access token',
          },
        },
        {
          provide: jwtConfiguration.KEY,
          useValue: {
            jwtAccessTokenTtl: 900, // 15 minutes
            jwtRefreshTokenTtl: 604800, // 7 days
            jwtSecret: 'test-secret',
            jwtTokenAudience: 'test-audience',
            jwtTokenIssuer: 'test-issuer',
          },
        },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    mockRedisService = module.get(IDENTIFIERS.REDIS_SERVICE);
    mockJwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signOut', () => {
    it('should successfully sign out user and clear cookies', async () => {
      const mockResponse = {
        clearCookie: jest.fn(),
      } as MockResponse;

      const mockDecodedAccess = { jti: 'access-jti-123', sub: 'user-123' };
      const mockDecodedRefresh = { jti: 'refresh-jti-456', sub: 'user-123' };

      mockJwtService.decode
        .mockReturnValueOnce(mockDecodedAccess)
        .mockReturnValueOnce(mockDecodedRefresh);

      mockRedisService.invalidate.mockResolvedValue();

      const result = await service.signOut(
        mockResponse as unknown as Response,
        'access-token',
        'refresh-token',
      );

      expect(mockRedisService.invalidate).toHaveBeenCalledWith('user-123');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });
      expect(result).toEqual({ message: 'Successfully signed out' });
    });

    it('should handle missing tokens gracefully', async () => {
      const mockResponse = {
        clearCookie: jest.fn(),
      } as MockResponse;

      const result = await service.signOut(mockResponse as unknown as Response);

      expect(mockRedisService.invalidate).not.toHaveBeenCalled();
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });
      expect(result).toEqual({ message: 'Successfully signed out' });
    });
  });
});
