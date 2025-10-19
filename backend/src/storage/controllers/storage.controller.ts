 // src/storage/storage.controller.ts
import { Controller, Get, Param, Res, Query, Post, Body } from '@nestjs/common';
import { Response } from 'express';
import { StorageService, AzureScannerService, ScanFilesService, EnhancedScanParserService } from '../services';
import { ScanParserService } from '../services/scan-parser.service';
import { Public } from '../../iam/authentication/decorators';
import { StartScanDto, ScanFiltersDto } from '../dto';

@Public()
@Controller('storage')
export class StorageController {
  private readonly HARDCODED_TARGETS = ['10.0.0.4', '10.0.0.5'];
  
  constructor(
    private readonly storage: StorageService,
    private readonly scanParser: ScanParserService,
    private readonly azureScanner: AzureScannerService,
    private readonly scanFiles: ScanFilesService,
    private readonly enhancedScanParser: EnhancedScanParserService
  ) {}

  @Get('containers')
  async containers() {
    return this.storage.listContainers();
  }

  @Get('targets')
  targets() {
    return { ok: true, targets: this.HARDCODED_TARGETS };
  }

  @Get('azure-scanner/health')
  async checkAzureScannerHealth() {
    return this.azureScanner.checkHealth();
  }

  @Post('azure-scanner/scan')
  async startAzureScan(@Body() scanRequest: StartScanDto) {
    return this.azureScanner.startScan(scanRequest);
  }

  @Get('azure-scanner/targets')
  async getAzureScannerTargets() {
    return this.azureScanner.getTargets();
  }

  @Get('available-scans')
  async getScansList(@Query() filters: ScanFiltersDto) {
    const containers = await this.storage.listContainers();
    if (containers.length === 0) {
      return { scans: [], total: 0, page: 1, limit: 10 };
    }
    return this.scanFiles.listAvailableScans(containers[0], filters);
  }

  @Get('scan-data/:target')
  async getScansByTarget(@Param('target') target: string) {
    const containers = await this.storage.listContainers();
    if (containers.length === 0) {
      return [];
    }
    return this.scanFiles.getScanByTarget(containers[0], target);
  }

  @Get('scan-data/:target/:date')
  async getScanResult(
    @Param('target') target: string,
    @Param('date') date: string
  ) {
    const containers = await this.storage.listContainers();
    if (containers.length === 0) {
      throw new Error('No containers available');
    }
    return this.scanFiles.getScanResults(containers[0], target, date);
  }

  @Get('test/parse-example-scans')
  async testParseExampleScans() {
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
          console.log(`Error reading file ${fileName}:`, (error as Error).message);
          files[fileName] = '';
        }
      }

      const result = await this.enhancedScanParser.parseAllScanResults('test', 'scans/scans_10-0-0-4_2025-08-24T21-51', files);
      
      return {
        message: 'Example scans parsed successfully',
        result
      };
    } catch (error: any) {
      console.error('Error parsing example scans:', error);
      throw new Error(`Failed to parse example scans: ${error.message}`);
    }
  }

  @Get('test/azure-storage-status')
  async testAzureStorageStatus() {
    try {
      const containers = await this.storage.listContainers();
      const containerDetails: any[] = [];
      
      for (const containerName of containers) {
        try {
          const blobs = await this.storage.listBlobs(containerName);
          containerDetails.push({
            name: containerName,
            blobCount: blobs.length,
            blobs: blobs.slice(0, 5)
          });
        } catch (error: any) {
          containerDetails.push({
            name: containerName,
            error: error.message
          });
        }
      }
      
      return {
        message: 'Azure Storage status',
        containers: containerDetails,
        totalContainers: containers.length
      };
    } catch (error: any) {
      console.error('Error checking Azure Storage status:', error);
      throw new Error(`Failed to check Azure Storage status: ${error.message}`);
    }
  }

  @Get(':container/scan-results')
  async getScanResults(
    @Param('container') container: string,
    @Query('target') target?: string,
    @Query('date') date?: string
  ) {
    try {
      // אוטו־דיטקט: אם חסר target/date, נאתר מה־blobs (ולכבד target אם כן סופק)
      if (!target || !date) {
        const auto = await this.findLatestScanBasePath(container, target);
        if (auto) {
          target = auto.target;
          date = auto.date;
        } else {
          // אין תוצרים — נחזיר אובייקט ריק עקבי
          const empty = await this.scanParser.parseScanResults(
            container,
            'scans/unknown/unknown',
            '',
            '',
            ''
          );
          return {
            ...empty,
            target: 'unknown',
            ip: 'unknown',
            scanDate: new Date().toISOString(),
          };
        }
      }

      const basePath = `scans/${target}/${date}`;

      // Nikto: קודם txt ואז csv (תאימות)
      const niktoPathTxt = `${basePath}/nikto.txt`;
      const niktoPathCsv = `${basePath}/nikto.csv`;
      const nmapPath = `${basePath}/nmap.xml`;
      const nucleiPath = `${basePath}/nuclei.json`;

      let niktoContent = '';
      let nmapContent = '';
      let nucleiContent = '';

      // Nikto
      try {
        const b = await this.storage.downloadToBuffer(container, niktoPathTxt);
        niktoContent = b.toString('utf8');
      } catch {
        try {
          const bCsv = await this.storage.downloadToBuffer(container, niktoPathCsv);
          niktoContent = bCsv.toString('utf8');
        } catch {
          console.log(`Nikto file not found: ${niktoPathTxt} / ${niktoPathCsv}`);
        }
      }

      // Nmap (אופציונלי)
      try {
        const b = await this.storage.downloadToBuffer(container, nmapPath);
        nmapContent = b.toString('utf8');
      } catch {
        console.log(`Nmap file not found: ${nmapPath}`);
      }

      // Nuclei (אופציונלי)
      try {
        const b = await this.storage.downloadToBuffer(container, nucleiPath);
        nucleiContent = b.toString('utf8');
      } catch {
        console.log(`Nuclei file not found: ${nucleiPath}`);
      }

      // Parse
      const parsed = await this.scanParser.parseScanResults(
        container,
        basePath,
        niktoContent,
        nmapContent,
        nucleiContent
      );

      // ✨ נורמליזציה: מדרוס תמיד target/ip/scanDate, וגם בתוך nikto/nuclei
      const normalizedTarget = target!;
      const normalizedScanDate = this.folderDateToIso(date!);

      return {
        ...parsed,
        target: normalizedTarget,
        ip: normalizedTarget,
        scanDate: normalizedScanDate,
        nikto: parsed?.nikto
          ? { ...parsed.nikto, target: normalizedTarget, ip: normalizedTarget }
          : undefined,
        nuclei: parsed?.nuclei
          ? { ...parsed.nuclei, target: normalizedTarget, ip: normalizedTarget }
          : undefined,
      };
    } catch (error: any) {
      console.error('Error getting scan results:', error);
      throw new Error(`Failed to get scan results: ${error.message}`);
    }
  }

  /**
   * מאתר את הסריקה העדכנית ביותר לפי מבנה:
   * scans/<TARGET>/<DATE>/<FILE>
   * אם סופק target — יוחזר התאריך העדכני ביותר עבורו.
   * אחרת — יוחזר העדכני ביותר בכלל.
   */
  private async findLatestScanBasePath(
    container: string,
    targetFilter?: string
  ): Promise<{ target: string; date: string } | null> {
    const blobs = await this.storage.listBlobs(container);
    if (!blobs || blobs.length === 0) return null;

    const CANDIDATE_FILES = ['nikto.txt', 'nikto.csv', 'nuclei.json', 'nmap.xml'];
    type Row = { target: string; date: string };

    const rows: Row[] = [];
    for (const b of blobs) {
      const name = (b as any).name || '';
      const parts = name.split('/');
      // scans/<TARGET>/<DATE>/<FILE>
      if (parts.length >= 4 && parts[0] === 'scans') {
        const [, tgt, dt, file] = parts;
        if (tgt && dt && CANDIDATE_FILES.includes(file)) {
          if (!targetFilter || targetFilter === tgt) {
            rows.push({ target: tgt, date: dt });
          }
        }
      }
    }

    if (rows.length === 0) return null;

    // תאריכים בפורמט 2025-09-07T12-46 — מיון לקסיקוגרפי עובד
    rows.sort((a, b) => b.date.localeCompare(a.date));
    return rows[0];
  }

  /** ממיר "2025-09-07T12-46" ל־ISO "2025-09-07T12:46:00.000Z" (בקירוב UTC) */
  private folderDateToIso(folderDate: string): string {
    try {
      const iso = folderDate.replace(/T(\d{2})-(\d{2})$/, 'T$1:$2:00Z');
      const d = new Date(iso);
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  @Get(':container/blobs/download')
  async download(
    @Param('container') container: string,
    @Query('path') path: string,
    @Res() res: Response,
  ) {
    const buf = await this.storage.downloadToBuffer(container, path);
    res.header('Content-Type', 'application/octet-stream');
    res.header('Content-Length', buf.length.toString());
    res.send(buf);
  }

  @Get(':container/blobs/url')
  url(@Param('container') container: string, @Query('path') path: string) {
    return { url: this.storage.getBlobUrl(container, path) };
  }

  @Get(':container/blobs')
  async blobs(@Param('container') container: string) {
    console.log(`[StorageController] blobs called for container: ${container}`);
    try {
      const result = await this.storage.listBlobs(container);
      console.log(`[StorageController] Storage service returned ${result.length} blobs`);
      console.log(`[StorageController] First few blobs:`, result.slice(0, 3));
      return result;
    } catch (error) {
      console.error(`[StorageController] Error in blobs method:`, error);
      throw error;
    }
  }

  @Get('reports/:target/:date/nikto')
  async getNiktoReport(
    @Param('target') target: string,
    @Param('date') date: string
  ) {
    try {
      const containers = await this.storage.listContainers();
      if (containers.length === 0) {
        throw new Error('No containers available');
      }
      
      const container = containers[0];
      const basePath = `scans/${target}/${date}`;
      const niktoPath = `${basePath}/nikto.txt`;
      
      let niktoContent = '';
      try {
        const niktoBuffer = await this.storage.downloadToBuffer(container, niktoPath);
        niktoContent = niktoBuffer.toString();
      } catch {
        console.log(`Nikto file not found: ${niktoPath}`);
        return { error: 'Nikto report not found', target, date };
      }
      
      const result = this.scanParser.parseNiktoCsv(niktoContent);
      if (result) {
        // דריסה תמידית — מונע "דליפה" של שם מארח מקובץ המקור
        result.target = target;
        result.ip = target;
        return result;
      }
      return { error: 'Failed to parse Nikto report', target, date };
    } catch (error: any) {
      console.error('Error getting Nikto report:', error);
      throw new Error(`Failed to get Nikto report: ${error.message}`);
    }
  }

  @Get('reports/:target/:date/nuclei')
  async getNucleiReport(
    @Param('target') target: string,
    @Param('date') date: string
  ) {
    try {
      const containers = await this.storage.listContainers();
      if (containers.length === 0) {
        throw new Error('No containers available');
      }
      
      const container = containers[0];
      const basePath = `scans/${target}/${date}`;
      const nucleiPath = `${basePath}/nuclei.json`;
      
      let nucleiContent = '';
      try {
        const nucleiBuffer = await this.storage.downloadToBuffer(container, nucleiPath);
        nucleiContent = nucleiBuffer.toString();
      } catch {
        console.log(`Nuclei file not found: ${nucleiPath}`);
        return { error: 'Nuclei report not found', target, date };
      }
      
      const result = this.scanParser.parseNucleiJson(nucleiContent);
      if (result) {
        // דריסה תמידית
        (result as any).target = target;
        (result as any).ip = target;
        return result;
      } else {
        return {
          target: target,
          ip: target,
          findings: [],
          note: 'Report parsed but no findings detected'
        };
      }
    } catch (error: any) {
      console.error('Error getting Nuclei report:', error);
      throw new Error(`Failed to get Nuclei report: ${error.message}`);
    }
  }

  @Get('reports/:target/:date/hydra')
  async getHydraReport(
    @Param('target') target: string,
    @Param('date') date: string
  ) {
    try {
      const containers = await this.storage.listContainers();
      if (containers.length === 0) {
        throw new Error('No containers available');
      }
      
      const container = containers[0];
      const basePath = `scans/${target}/${date}`;
      const hydraPath = `${basePath}/hydra_dvwa.json`;
      
      let hydraContent = '';
      try {
        const hydraBuffer = await this.storage.downloadToBuffer(container, hydraPath);
        hydraContent = hydraBuffer.toString();
      } catch {
        console.log(`Hydra file not found: ${hydraPath}`);
        return { error: 'Hydra report not found', target, date };
      }
      
      try {
        const data = JSON.parse(hydraContent);
        return {
          target,
          date,
          status: data.dvwa_bruteforce || 'unknown',
          results: data.results || []
        };
      } catch {
        return { error: 'Failed to parse Hydra report', target, date };
      }
    } catch (error: any) {
      console.error('Error getting Hydra report:', error);
      throw new Error(`Failed to get Hydra report: ${error.message}`);
    }
  }

  @Get('reports/:target/:date/gobuster')
  async getGobusterReport(
    @Param('target') target: string,
    @Param('date') date: string
  ) {
    try {
      const containers = await this.storage.listContainers();
      if (containers.length === 0) {
        throw new Error('No containers available');
      }
      
      const container = containers[0];
      const basePath = `scans/${target}/${date}`;
      const gobusterPath = `${basePath}/gobuster.json`;
      
      let gobusterContent = '';
      try {
        const gobusterBuffer = await this.storage.downloadToBuffer(container, gobusterPath);
        gobusterContent = gobusterBuffer.toString();
      } catch {
        console.log(`Gobuster file not found: ${gobusterPath}`);
        return { error: 'Gobuster report not found', target, date };
      }
      
      try {
        const data = JSON.parse(gobusterContent);
        return {
          target,
          date,
          directories: data.directories || [],
          error: data.error || null
        };
      } catch {
        return { error: 'Failed to parse Gobuster report', target, date };
      }
    } catch (error: any) {
      console.error('Error getting Gobuster report:', error);
      throw new Error(`Failed to get Gobuster report: ${error.message}`);
    }
  }

  @Get('reports/:target/:date/sqlmap')
  async getSqlmapReport(
    @Param('target') target: string,
    @Param('date') date: string
  ) {
    try {
      const containers = await this.storage.listContainers();
      if (containers.length === 0) {
        throw new Error('No containers available');
      }
      
      const container = containers[0];
      const basePath = `scans/${target}/${date}`;
      const sqlmapPath = `${basePath}/sqlmap_summary.json`;
      
      let sqlmapContent = '';
      try {
        const sqlmapBuffer = await this.storage.downloadToBuffer(container, sqlmapPath);
        sqlmapContent = sqlmapBuffer.toString();
      } catch {
        console.log(`Sqlmap file not found: ${sqlmapPath}`);
        return { error: 'Sqlmap report not found', target, date };
      }
      
      try {
        const data = JSON.parse(sqlmapContent);
        return {
          target,
          date,
          status: data.sqlmap_scan || 'unknown',
          pathsTested: data.dvwa_paths_tested || []
        };
      } catch {
        return { error: 'Failed to parse Sqlmap report', target, date };
      }
    } catch (error: any) {
      console.error('Error getting Sqlmap report:', error);
      throw new Error(`Failed to get Sqlmap report: ${error.message}`);
    }
  }

  @Get('reports/:target/:date/credentials')
  async getCredentialsReport(
    @Param('target') target: string,
    @Param('date') date: string
  ) {
    try {
      const containers = await this.storage.listContainers();
      if (containers.length === 0) {
        throw new Error('No containers available');
      }
      
      const container = containers[0];
      const basePath = `scans/${target}/${date}`;
      const credsPath = `${basePath}/dvwa_creds.txt`;
      
      let credsContent = '';
      try {
        const credsBuffer = await this.storage.downloadToBuffer(container, credsPath);
        credsContent = credsBuffer.toString();
      } catch {
        console.log(`Credentials file not found: ${credsPath}`);
        return { error: 'Credentials file not found', target, date };
      }
      
      const credentials = credsContent
        .trim()
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          const [username, password] = line.split(':');
          return { username, password };
        });
      
      return {
        target,
        date,
        totalCredentials: credentials.length,
        credentials
      };
    } catch (error: any) {
      console.error('Error getting credentials report:', error);
      throw new Error(`Failed to get credentials report: ${error.message}`);
    }
  }

  @Get('reports/:target/:date/wordlist')
  async getWordlistReport(
    @Param('target') target: string,
    @Param('date') date: string
  ) {
    try {
      const containers = await this.storage.listContainers();
      if (containers.length === 0) {
        throw new Error('No containers available');
      }
      
      const container = containers[0];
      const basePath = `scans/${target}/${date}`;
      const wordlistPath = `${basePath}/dvwa_words.txt`;
      
      let wordlistContent = '';
      try {
        const wordlistBuffer = await this.storage.downloadToBuffer(container, wordlistPath);
        wordlistContent = wordlistBuffer.toString();
      } catch {
        console.log(`Wordlist file not found: ${wordlistPath}`);
        return { error: 'Wordlist file not found', target, date };
      }
      
      const words = wordlistContent
        .trim()
        .split('\n')
        .filter(word => word.trim() !== '');
      
      return {
        target,
        date,
        totalWords: words.length,
        words
      };
    } catch (error: any) {
      console.error('Error getting wordlist report:', error);
      throw new Error(`Failed to get wordlist report: ${error.message}`);
    }
  }

  @Get('reports/:target/:date/summary')
  async getScanSummary(
    @Param('target') target: string,
    @Param('date') date: string
  ) {
    try {
      const containers = await this.storage.listContainers();
      if (containers.length === 0) {
        throw new Error('No containers available');
      }
      
      const container = containers[0];
      const basePath = `scans/${target}/${date}`;
      const files = [
        { name: 'nikto.txt', path: `${basePath}/nikto.txt` },
        { name: 'nuclei.json', path: `${basePath}/nuclei.json` },
        { name: 'hydra_dvwa.json', path: `${basePath}/hydra_dvwa.json` },
        { name: 'gobuster.json', path: `${basePath}/gobuster.json` },
        { name: 'sqlmap_summary.json', path: `${basePath}/sqlmap_summary.json` },
        { name: 'dvwa_creds.txt', path: `${basePath}/dvwa_creds.txt` },
        { name: 'dvwa_words.txt', path: `${basePath}/dvwa_words.txt` }
      ];
      
      const fileContents: { [key: string]: string } = {};
      
      for (const file of files) {
        try {
          const buffer = await this.storage.downloadToBuffer(container, file.path);
          fileContents[file.name] = buffer.toString();
        } catch {
          console.log(`File not found: ${file.path}`);
          fileContents[file.name] = '';
        }
      }
      
      const nikto = this.scanParser.parseNiktoCsv(fileContents['nikto.txt'] || '');
      const nuclei = this.scanParser.parseNucleiJson(fileContents['nuclei.json'] || '');
      const totalVulnerabilities = (nikto?.vulnerabilities?.length || 0) + (nuclei?.findings?.length || 0);
      const openPorts = 0; // אין כרגע nmap.xml בסביבות שהצגת

      const criticalFindings = (nuclei?.findings?.filter(f => f.severity === 'critical').length || 0);
      const highFindings = (nuclei?.findings?.filter(f => f.severity === 'high').length || 0);
      const mediumFindings = (nuclei?.findings?.filter(f => f.severity === 'medium').length || 0);
      const lowFindings = (nuclei?.findings?.filter(f => f.severity === 'low').length || 0);
      
      let credentials: { username: string; password: string }[] = [];
      let wordlist: string[] = [];
      let hydraStatus = 'unknown';
      let gobusterDirectories: string[] = [];
      let sqlmapPaths: string[] = [];
      
      try {
        if (fileContents['dvwa_creds.txt']) {
          credentials = fileContents['dvwa_creds.txt']
            .trim()
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => {
              const [username, password] = line.split(':');
              return { username, password };
            });
        }
      } catch {}

      try {
        if (fileContents['dvwa_words.txt']) {
          wordlist = fileContents['dvwa_words.txt']
            .trim()
            .split('\n')
            .filter(word => word.trim() !== '');
        }
      } catch {}

      try {
        if (fileContents['hydra_dvwa.json']) {
          const hydraData = JSON.parse(fileContents['hydra_dvwa.json']);
          hydraStatus = hydraData.dvwa_bruteforce || 'unknown';
        }
      } catch {}

      try {
        if (fileContents['gobuster.json']) {
          const gobusterData = JSON.parse(fileContents['gobuster.json']);
          gobusterDirectories = gobusterData.directories || [];
        }
      } catch {}

      try {
        if (fileContents['sqlmap_summary.json']) {
          const sqlmapData = JSON.parse(fileContents['sqlmap_summary.json']);
          sqlmapPaths = sqlmapData.dvwa_paths_tested || [];
        }
      } catch {}
      
      return {
        target,
        ip: target,
        scanDate: this.folderDateToIso(date),
        nikto: nikto ? { ...nikto, target, ip: target } : undefined,
        nuclei: nuclei ? { ...nuclei, target, ip: target } : undefined,
        summary: {
          totalVulnerabilities,
          openPorts,
          criticalFindings,
          highFindings,
          mediumFindings,
          lowFindings
        },
        additionalData: {
          credentials: {
            total: credentials.length,
            list: credentials
          },
          wordlist: {
            total: wordlist.length,
            list: wordlist
          },
          hydra: {
            status: hydraStatus
          },
          gobuster: {
            directories: gobusterDirectories
          },
          sqlmap: {
            pathsTested: sqlmapPaths
          }
        }
      };
    } catch (error: any) {
      console.error('Error getting scan summary:', error);
      throw new Error(`Failed to get scan summary: ${error.message}`);
    }
  }
}
