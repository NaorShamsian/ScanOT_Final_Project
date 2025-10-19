export interface IAppConfiguration {
  port: number;
  host: string;
  sessionSecret: string;
  sessionSalt: string;
  nodeEnv: string;
  azureScanner: {
    baseUrl: string;
    timeout: number;
  };
}
