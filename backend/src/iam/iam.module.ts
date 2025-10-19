import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { HashingService } from './hashing/services/hashing.service';
import { Pbkdf2Service } from './hashing/services/pbkdf2.service';
import {
  ConfigurationModule,
  jwtConfiguration,
  securityConfiguration,
} from '../configuration';
import { PrismaModule } from '../prisma';
import { RedisModule } from '../redis/redis.module';
import {
  BasicAuthStrategy,
  JwtStrategy,
  RefreshTokenStrategy,
  AuthenticationService,
  AuthenticationController,
  RefreshTokenIdsStorage,
} from './authentication';
import { RedisService } from '../redis/services/redis.service';
import { CommonModule } from '../common';
import { JwtModule } from '@nestjs/jwt';
import { IJwtConfiguration } from '../configuration';
import { IDENTIFIERS } from '../shared';

@Module({
  imports: [
    ConfigurationModule,
    ConfigModule.forFeature(securityConfiguration),
    ConfigModule.forFeature(jwtConfiguration),
    PrismaModule,
    RedisModule,
    PassportModule,
    CommonModule,
    JwtModule.registerAsync({
      imports: [ConfigurationModule, RedisModule],
      useFactory: (config: IJwtConfiguration) => ({
        secret: config.jwtSecret,
        signOptions: {
          expiresIn: config.jwtAccessTokenTtl,
          audience: config.jwtTokenIssuer,
          issuer: config.jwtTokenIssuer,
        },
      }),
      inject: [jwtConfiguration.KEY],
    }),
  ],
  providers: [
    {
      provide: HashingService,
      useClass: Pbkdf2Service,
    },
    {
      provide: IDENTIFIERS.REDIS_SERVICE,
      useClass: RedisService,
    },
    AuthenticationService,
    BasicAuthStrategy,
    JwtStrategy,
    RefreshTokenStrategy,
    RefreshTokenIdsStorage,
  ],
  controllers: [AuthenticationController],
  exports: [HashingService],
})
export class IamModule {}
