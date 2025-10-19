import { Injectable } from '@nestjs/common';
import { StorageService } from './storage.service';
import { EnhancedScanParserService } from './enhanced-scan-parser.service';
import { ScanSummaryDto, ScanListDto, ScanFiltersDto } from '../dto/scan-results.dto';

@Injectable()
export class ScanFilesService {
  constructor(
    private readonly storageService: StorageService,
    private readonly scanParser: EnhancedScanParserService
  ) {}

  async getScanResults(
    container: string,
    target: string,
    date: string
  ): Promise<ScanSummaryDto> {
    try {
      const basePath = `scans/scans_${target}_${date}`;
      
      const scanFiles = [
        'dvwa_creds.txt',
        'dvwa_words.txt',
        'gobuster.json',
        'hydra_dvwa.json',
        'hydra_dvwa.txt',
        'nikto.txt',
        'nuclei.json',
        'sqlmap_summary.json'
      ];

      const files: { [key: string]: string } = {};
      
      for (const fileName of scanFiles) {
        try {
          const filePath = `${basePath}/${fileName}`;
          const buffer = await this.storageService.downloadToBuffer(container, filePath);
          files[fileName] = buffer.toString();
        } catch (error) {
          console.log(`File not found: ${fileName}`);
          files[fileName] = '';
        }
      }

      return await this.scanParser.parseAllScanResults(container, basePath, files);
    } catch (error) {
      console.error('Error getting scan results:', error);
      throw new Error(`Failed to get scan results: ${error.message}`);
    }
  }

  async listAvailableScans(
    container: string,
    filters: ScanFiltersDto
  ): Promise<ScanListDto> {
    try {
      const blobs = await this.storageService.listBlobs(container);
      
      const scanBlobs = blobs.filter(blob => 
        blob.name.startsWith('scans/scans_') && 
        blob.name.includes('_') &&
        blob.name.includes('_dvwa_')
      );
      const scanInfos = scanBlobs.map(blob => {
        const parts = blob.name.split('/')[1].split('_');
        if (parts.length >= 4) {
          const target = parts[1];
          const date = parts[2] + '_' + parts[3];
          return { target, date, blobName: blob.name };
        }
        return null;
      }).filter(Boolean);

      let filteredScans = scanInfos.filter((scan): scan is NonNullable<typeof scan> => scan !== null);
      
      if (filters.target) {
        filteredScans = filteredScans.filter(scan => 
          scan.target === filters.target
        );
      }
      
      if (filters.date) {
        filteredScans = filteredScans.filter(scan => 
          scan.date.includes(filters.date!)
        );
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedScans = filteredScans.slice(startIndex, endIndex);

      const scanResults: ScanSummaryDto[] = [];
      
      for (const scanInfo of paginatedScans) {
        try {
          const result = await this.getScanResults(
            container, 
            scanInfo.target, 
            scanInfo.date
          );
          scanResults.push(result);
        } catch (error) {
          console.error(`Error getting scan result for ${scanInfo.target}_${scanInfo.date}:`, error);
          scanResults.push({
            target: scanInfo.target,
            ip: scanInfo.target,
            scanDate: new Date().toISOString(),
            summary: {
              totalVulnerabilities: 0,
              openPorts: 0,
              criticalFindings: 0,
              highFindings: 0,
              mediumFindings: 0,
              lowFindings: 0,
              totalCredentials: 0,
              totalDirectories: 0
            }
          });
        }
      }

      return {
        scans: scanResults,
        total: filteredScans.length,
        page,
        limit
      };
    } catch (error) {
      console.error('Error listing available scans:', error);
      throw new Error(`Failed to list scans: ${error.message}`);
    }
  }

  async getScanByTarget(
    container: string,
    target: string
  ): Promise<ScanSummaryDto[]> {
    try {
      const blobs = await this.storageService.listBlobs(container);
      
      const targetScans = blobs.filter(blob => 
        blob.name.startsWith(`scans/scans_${target}_`)
      );

      const results: ScanSummaryDto[] = [];
      
      for (const blob of targetScans) {
        try {
          const parts = blob.name.split('/')[1].split('_');
          if (parts.length >= 4) {
            const date = parts[2] + '_' + parts[3];
            const result = await this.getScanResults(container, target, date);
            results.push(result);
          }
        } catch (error) {
          console.error(`Error processing scan ${blob.name}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('Error getting scans by target:', error);
      throw new Error(`Failed to get scans by target: ${error.message}`);
    }
  }
  async getTestScanResults(): Promise<ScanSummaryDto> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const scansDir = path.join(process.cwd(), 'examples', 'scans');
      const files: { [key: string]: string } = {};
      
      const scanFiles = [
        'dvwa_creds.txt',
        'dvwa_words.txt',
        'gobuster.json',
        'hydra_dvwa.json',
        'hydra_dvwa.txt',
        'nikto.txt',
        'nuclei.json',
        'sqlmap_summary.json'
      ];

      for (const fileName of scanFiles) {
        try {
          const filePath = path.join(scansDir, fileName);
          if (fs.existsSync(filePath)) {
            files[fileName] = fs.readFileSync(filePath, 'utf8');
          } else {
            files[fileName] = '';
          }
        } catch (error) {
          console.log(`Error reading file ${fileName}:`, error.message);
          files[fileName] = '';
        }
      }

      return await this.scanParser.parseAllScanResults('test', 'scans/scans_10-0-0-4_2025-08-24T21-51', files);
    } catch (error) {
      console.error('Error getting test scan results:', error);
      throw new Error(`Failed to get test scan results: ${error.message}`);
    }
  }
}
