import { registerAs } from '@nestjs/config';
import { IAppConfiguration } from './app.configuration.interface';

const appConfiguration = registerAs(
  'app',
  function createAppConfiguration(): IAppConfiguration {
    return {
      port: Number.isInteger(Number(process.env.PORT))
        ? parseInt(process.env.PORT!, 10)
        : 3003,
      host: process.env.HOST || '127.0.0.1',
      sessionSecret:
        process.env.SESSION_SECRET || 'averylogphrasebiggerthanthirtytwochars',
      sessionSalt: process.env.SESSION_SALT || 'sa1tySa1t1234567',
      nodeEnv: process.env.NODE_ENV || 'development',
      azureScanner: {
        baseUrl: process.env.AZURE_SCANNER_BASE_URL || 'http://20.217.200.191:8080',
        timeout: Number(process.env.AZURE_SCANNER_TIMEOUT) || 30000,
      },
    };
  },
);

export { appConfiguration };
