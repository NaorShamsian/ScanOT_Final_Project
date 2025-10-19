import { Injectable } from '@nestjs/common';
import { 
  ScanSummaryDto, 
  ScanToolResultDto, 
  ScanVulnerabilityDto, 
  ScanPortDto,
  ScanSummarySummaryDto
} from '../dto/scan-results.dto';

@Injectable()
export class EnhancedScanParserService {
  
  parseHydraTxt(content: string): ScanToolResultDto | null {
    try {
      if (!content || content.trim() === '') return null;
      
      const lines = content.trim().split('\n');
      if (lines.length < 2) return null;

      const headerLine = lines[0];
      const targetMatch = headerLine.match(/on ([^\s]+)/);
      const target = targetMatch ? targetMatch[1] : 'unknown';
      
      const credentials: ScanVulnerabilityDto[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('[') && line.includes('login:') && line.includes('password:')) {
          const credMatch = line.match(/login:\s*([^\s]+)\s+password:\s*([^\s]+)/);
          if (credMatch) {
            const [, login, password] = credMatch;
            credentials.push({
              id: `hydra-cred-${i}`,
              method: 'POST',
              path: '/login',
              description: `Found credentials: ${login}:${password}`,
              severity: 'high'
            });
          }
        }
      }

      return {
        target,
        ip: target,
        vulnerabilities: credentials
      };
    } catch (error) {
      console.error('Error parsing Hydra TXT:', error);
      return null;
    }
  }

  parseHydraJson(content: string): ScanToolResultDto | null {
    try {
      if (!content || content.trim() === '') return null;
      
      const data = JSON.parse(content);
      if (!data.results || !Array.isArray(data.results)) return null;

      const target = data.target || 'unknown';
      const credentials: ScanVulnerabilityDto[] = [];
      
      data.results.forEach((result: string, index: number) => {
        const credMatch = result.match(/login:\s*([^\s]+)\s+password:\s*([^\s]+)/);
        if (credMatch) {
          const [, login, password] = credMatch;
          credentials.push({
            id: `hydra-cred-${index}`,
            method: 'POST',
            path: '/login',
            description: `Found credentials: ${login}:${password}`,
            severity: 'high'
          });
        }
      });

      return {
        target,
        ip: target,
        vulnerabilities: credentials
      };
    } catch (error) {
      console.error('Error parsing Hydra JSON:', error);
      return null;
    }
  }

  parseGobusterJson(content: string): ScanToolResultDto | null {
    try {
      if (!content || content.trim() === '') return null;
      
      const data = JSON.parse(content);
      if (!data.directories || !Array.isArray(data.directories)) return null;

      const target = data.target || 'unknown';
      const directories: ScanVulnerabilityDto[] = [];
      
      data.directories.forEach((dir: string, index: number) => {
        directories.push({
          id: `gobuster-dir-${index}`,
          method: 'GET',
          path: dir,
          description: `Found directory: ${dir}`,
          severity: 'info'
        });
      });

      return {
        target,
        ip: target,
        vulnerabilities: directories
      };
    } catch (error) {
      console.error('Error parsing Gobuster JSON:', error);
      return null;
    }
  }

  parseSqlmapJson(content: string): ScanToolResultDto | null {
    try {
      if (!content || content.trim() === '') return null;
      
      const data = JSON.parse(content);
      if (!data.dvwa_paths_tested || !Array.isArray(data.dvwa_paths_tested)) return null;

      const target = data.target || 'unknown';
      const sqlInjectionPaths: ScanVulnerabilityDto[] = [];
      
      data.dvwa_paths_tested.forEach((path: string, index: number) => {
        sqlInjectionPaths.push({
          id: `sqlmap-path-${index}`,
          method: 'GET',
          path: path,
          description: `SQL injection path tested: ${path}`,
          severity: 'high'
        });
      });

      return {
        target,
        ip: target,
        vulnerabilities: sqlInjectionPaths
      };
    } catch (error) {
      console.error('Error parsing SQLMap JSON:', error);
      return null;
    }
  }

  parseNiktoTxt(content: string): ScanToolResultDto | null {
    try {
      if (!content || content.trim() === '') return null;
      
      const lines = content.trim().split('\n');
      if (lines.length < 2) return null;

      const headerLine = lines[0];
      const targetMatch = headerLine.match(/Target Host:\s*([^\s]+)/);
      const target = targetMatch ? targetMatch[1] : 'unknown';
      
      const vulnerabilities: ScanVulnerabilityDto[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('+') || line.startsWith('-')) {
          const pathMatch = line.match(/GET\s+([^\s]+)/);
          const path = pathMatch ? pathMatch[1] : '/';
          
          vulnerabilities.push({
            id: `nikto-${i}`,
            method: 'GET',
            path: path,
            description: line.substring(1).trim(),
            severity: 'medium'
          });
        }
      }

      return {
        target,
        ip: target,
        vulnerabilities
      };
    } catch (error) {
      console.error('Error parsing Nikto TXT:', error);
      return null;
    }
  }

  parseNucleiJson(content: string): ScanToolResultDto | null {
    try {
      if (!content || content.trim() === '') return null;
      
      const data = JSON.parse(content);
      if (data.error) return null;

      const target = data.target || 'unknown';
      const findings: ScanVulnerabilityDto[] = [];
      
      if (Array.isArray(data)) {
        data.forEach((item: any, index: number) => {
          findings.push({
            id: `nuclei-${index}`,
            method: 'GET',
            path: item.path || '/',
            description: item.info?.description || item.description || 'Vulnerability found',
            severity: item.info?.severity || item.severity || 'medium',
            reference: item.info?.reference || item.reference
          });
        });
      }

      return {
        target,
        ip: target,
        findings
      };
    } catch (error) {
      console.error('Error parsing Nuclei JSON:', error);
      return null;
    }
  }

  async parseAllScanResults(
    container: string,
    targetPath: string,
    files: { [key: string]: string }
  ): Promise<ScanSummaryDto> {
    
    const hydraTxt = this.parseHydraTxt(files['hydra_dvwa.txt'] || '');
    const hydraJson = this.parseHydraJson(files['hydra_dvwa.json'] || '');
    const gobuster = this.parseGobusterJson(files['gobuster.json'] || '');
    const sqlmap = this.parseSqlmapJson(files['sqlmap_summary.json'] || '');
    const nikto = this.parseNiktoTxt(files['nikto.txt'] || '');
    const nuclei = this.parseNucleiJson(files['nuclei.json'] || '');

    let target = 'unknown';
    let ip = 'unknown';
    
    const allResults = [hydraTxt, hydraJson, gobuster, sqlmap, nikto, nuclei].filter(Boolean) as ScanToolResultDto[];
    if (allResults.length > 0) {
      target = allResults[0].target;
      ip = allResults[0].ip;
    } else {
      const pathParts = targetPath.split('/');
      target = pathParts[pathParts.length - 2] || 'unknown';
      ip = target;
    }
    const allVulnerabilities = [
      ...(hydraTxt?.vulnerabilities || []),
      ...(hydraJson?.vulnerabilities || []),
      ...(gobuster?.vulnerabilities || []),
      ...(sqlmap?.vulnerabilities || []),
      ...(nikto?.vulnerabilities || []),
      ...(nuclei?.findings || [])
    ];

    const totalVulnerabilities = allVulnerabilities.length;
    const totalCredentials = (hydraTxt?.vulnerabilities?.length || 0) + (hydraJson?.vulnerabilities?.length || 0);
    const totalDirectories = gobuster?.vulnerabilities?.length || 0;
    
    const criticalFindings = allVulnerabilities.filter(v => v.severity === 'critical').length;
    const highFindings = allVulnerabilities.filter(v => v.severity === 'high').length;
    const mediumFindings = allVulnerabilities.filter(v => v.severity === 'medium').length;
    const lowFindings = allVulnerabilities.filter(v => v.severity === 'low').length;

    return {
      target,
      ip,
      scanDate: new Date().toISOString(),
      hydra: hydraTxt || hydraJson || undefined,
      gobuster: gobuster || undefined,
      sqlmap: sqlmap || undefined,
      nikto: nikto || undefined,
      nuclei: nuclei || undefined,
      summary: {
        totalVulnerabilities,
        openPorts: 0,
        criticalFindings,
        highFindings,
        mediumFindings,
        lowFindings,
        totalCredentials,
        totalDirectories
      }
    } as ScanSummaryDto;
  }
}
