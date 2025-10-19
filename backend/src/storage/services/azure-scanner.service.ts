import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';
import * as https from 'https';
import { 
  IAzureScannerHealthResponse, 
  IAzureScannerScanResponse, 
  IAzureScannerTargetsResponse,
  IAzureScannerError 
} from '../types';
import { StartScanDto } from '../dto';

@Injectable()
export class AzureScannerService {
  private readonly logger = new Logger(AzureScannerService.name);
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(private readonly configService: ConfigService) {
    const appConfig = this.configService.get('app');
    this.baseUrl = appConfig.azureScanner.baseUrl;
    this.timeout = appConfig.azureScanner.timeout;
  }

  private createErrorResponse(error: string, message: string): IAzureScannerError {
    return {
      ok: false,
      error,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  private handleHttpError(error: any, operation: string): HttpException {
    this.logger.error(`Azure Scanner ${operation} failed:`, error.message);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new HttpException(
        this.createErrorResponse(
          'CONNECTION_ERROR',
          `Cannot connect to Azure Scanner at ${this.baseUrl}`
        ),
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    if (error.code === 'ECONNABORTED') {
      return new HttpException(
        this.createErrorResponse(
          'TIMEOUT_ERROR',
          `Azure Scanner request timed out after ${this.timeout}ms`
        ),
        HttpStatus.REQUEST_TIMEOUT
      );
    }

    if (error.statusCode) {
      const status = error.statusCode;
      const data = error.payload;
      
      return new HttpException(
        this.createErrorResponse(
          'HTTP_ERROR',
          `Azure Scanner returned ${status}: ${JSON.stringify(data)}`
        ),
        status
      );
    }

    return new HttpException(
      this.createErrorResponse(
        'UNKNOWN_ERROR',
        `Azure Scanner ${operation} failed: ${error.message}`
      ),
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  private makeHttpRequest(url: string, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port ? parseInt(urlObj.port, 10) : undefined,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      };
      
      const req = httpModule.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: jsonData });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data: data });
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('ECONNABORTED'));
      });
      
      req.setTimeout(this.timeout);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  async checkHealth(): Promise<IAzureScannerHealthResponse> {
    try {
      this.logger.log(`Checking Azure Scanner health at ${this.baseUrl}/health`);
      
      const response = await this.makeHttpRequest(`${this.baseUrl}/health`, {
        method: 'GET',
      });

      if (response.statusCode !== 200) {
        throw new Error(`HTTP ${response.statusCode}: ${response.data}`);
      }

      this.logger.log('Azure Scanner health check successful');
      return response.data;
    } catch (error) {
      throw this.handleHttpError(error, 'health check');
    }
  }

  async startScan(scanRequest: StartScanDto): Promise<IAzureScannerScanResponse> {
    try {
      this.logger.log(`Starting scan for target: ${scanRequest.target}`);
      
      const response = await this.makeHttpRequest(`${this.baseUrl}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanRequest),
      });

      // HTTP 202 Accepted - нормально для асинхронных операций
      if (response.statusCode !== 200 && response.statusCode !== 202) {
        throw new Error(`HTTP ${response.statusCode}: ${response.data}`);
      }

      const data = response.data;
      this.logger.log(`Scan started successfully for target: ${scanRequest.target}`);
      return data;
    } catch (error) {
      throw this.handleHttpError(error, 'scan start');
    }
  }

  async getTargets(): Promise<IAzureScannerTargetsResponse> {
    try {
      this.logger.log('Fetching targets from Azure Scanner');
      
      const response = await this.makeHttpRequest(`${this.baseUrl}/targets`, {
        method: 'GET',
      });

      if (response.statusCode !== 200) {
        throw new Error(`HTTP ${response.statusCode}: ${response.data}`);
      }

      const data = response.data;
      this.logger.log(`Retrieved ${data.targets.length} targets from Azure Scanner`);
      return data;
    } catch (error) {
      throw this.handleHttpError(error, 'targets fetch');
    }
  }
}
