// src/storage/storage.module.ts
import { Module } from '@nestjs/common';
import { StorageService, AzureScannerService, EnhancedScanParserService, ScanFilesService } from './services';
import { StorageController } from './controllers';
import { ScanParserService } from './services/scan-parser.service';
import { ConfigModule } from '@nestjs/config';
import { storageConfiguration, appConfiguration } from '../configuration';

@Module({
  imports: [
    ConfigModule.forFeature(storageConfiguration),
    ConfigModule.forFeature(appConfiguration)
  ],
  providers: [StorageService, ScanParserService, AzureScannerService, EnhancedScanParserService, ScanFilesService],
  controllers: [StorageController],
  exports: [StorageService, AzureScannerService, ScanFilesService],
})
export class StorageModule {}
