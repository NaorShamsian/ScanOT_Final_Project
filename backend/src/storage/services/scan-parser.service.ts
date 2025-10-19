import { Injectable } from '@nestjs/common';
import { NiktoResult, NmapResult, NucleiResult, ScanSummary } from '../types/scan-results.interface';

@Injectable()
export class ScanParserService {

  // ===== helpers =====
  private extractFromPath(targetPath: string): { target: string; ip: string; scanDate?: string } {
    // מצפה למבנה: scans/<ip-with-dashes>/<YYYY-MM-DDTHH-MM>/<file>
    // דוגמה: scans/10-0-0-4/2025-09-07T09-20/nuclei.json
    const parts = (targetPath || '').split('/').filter(Boolean);

    // חפש סגמנט שנראה כמו IP עם מקפים
    const ipDashIdx = parts.findIndex(p => /^\d{1,3}(-\d{1,3}){3}$/.test(p));
    const ipWithDashes = ipDashIdx >= 0 ? parts[ipDashIdx] : undefined;
    const ip = ipWithDashes ? ipWithDashes.replace(/-/g, '.') : 'unknown';

    // חפש סגמנט זמן: YYYY-MM-DDTHH-MM
    const tsIdx = parts.findIndex(p => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}$/.test(p));
    let scanDate: string | undefined;
    if (tsIdx >= 0) {
      const ts = parts[tsIdx]; // 2025-09-07T09-20
      const [date, hm] = ts.split('T');
      const [hh, mm] = hm.split('-');
      // נבנה ISO (ללא timezone מקומי; אם צריך Z – משאירים Z)
      scanDate = `${date}T${hh}:${mm}:00.000Z`;
    }

    return { target: ip, ip, scanDate };
  }

  // ===== parsers =====
  parseNiktoCsv(content: string): NiktoResult | null {
    try {
      if (!content || content.trim() === '') return null;

      const lines = content.trim().split('\n');
      if (lines.length < 2) return null;

      let target = 'unknown';
      let ip = 'unknown';
      let port = '80';

      for (const line of lines) {
        if (line.startsWith('+ Target Host:')) {
          const targetMatch = line.match(/\+ Target Host:\s*([^\s]+)/);
          if (targetMatch) {
            target = targetMatch[1];
            ip = target;
          }
        }
        if (line.startsWith('+ Target Port:')) {
          const portMatch = line.match(/\+ Target Port:\s*(\d+)/);
          if (portMatch) port = portMatch[1];
        }
      }

      const vulnerabilities: NiktoResult['vulnerabilities'] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || !line.startsWith('+ ')) continue;

        const cleanLine = line.substring(2);

        const vulnMatch = cleanLine.match(/^([A-Z]+)\s+([^:]+):\s*(.+)$/);
        if (vulnMatch) {
          const [, method, path, description] = vulnMatch;
          vulnerabilities.push({
            id: `NIKTO-${i}`,
            method: method || 'N/A',
            path: path || 'N/A',
            description: description || 'N/A',
          });
        } else {
          const altVulnMatch = cleanLine.match(/^([^:]+):\s*(.+)$/);
          if (altVulnMatch) {
            const [, path, description] = altVulnMatch;
            vulnerabilities.push({
              id: `NIKTO-${i}`,
              method: 'GET',
              path: path || 'N/A',
              description: description || 'N/A',
            });
          }
        }
      }

      return {
        target,
        ip,
        port,
        vulnerabilities,
      };
    } catch (error) {
      console.error('Error parsing Nikto CSV:', error);
      return null;
    }
  }

  parseNmapXml(content: string): NmapResult | null {
    try {
      if (!content || !content.includes('<nmaprun')) return null;

      const targetMatch = content.match(/<address addr="([^"]+)" addrtype="ipv4"/);
      const hostnameMatch = content.match(/<hostname name="([^"]+)"/);

      if (!targetMatch) return null;

      const ip = targetMatch[1];
      const target = hostnameMatch ? hostnameMatch[1] : ip;

      const ports: NmapResult['ports'] = [];
      const portMatches = content.matchAll(/<port protocol="([^"]+)" portid="([^"]+)">\s*<state state="([^"]+)"/g);

      for (const match of portMatches) {
        const [, protocol, port, state] = match;
        if (state === 'open') {
          const serviceMatch = content.match(
            new RegExp(`<port protocol="${protocol}" portid="${port}">[\\s\\S]*?<service name="([^"]+)"`)
          );
          const service = serviceMatch ? serviceMatch[1] : 'unknown';
          ports.push({ port: parseInt(port, 10), protocol, state, service });
        }
      }

      return { target, ip, ports };
    } catch (error) {
      console.error('Error parsing Nmap XML:', error);
      return null;
    }
  }

  parseNucleiJson(content: string): NucleiResult | null {
    try {
      if (!content || content.trim() === '') return null;

      const data = JSON.parse(content);

      // אם מגיע אובייקט שגיאה – להתעלם
      if (data && typeof data === 'object' && !Array.isArray(data) && (data.error || data.message === 'skipped')) {
        return null;
      }

      const toFinding = (item: any) => ({
        template: item?.template || 'unknown',
        severity: (item?.info?.severity || item?.severity || 'unknown')?.toString()?.toLowerCase?.() || 'unknown',
        description: item?.info?.description || item?.description || 'unknown',
        reference: item?.info?.reference || item?.reference,
      });

      if (Array.isArray(data)) {
        if (data.length === 0) return { target: 'unknown', ip: 'unknown', findings: [] };
        const first = data[0] || {};
        const target = first.host || first.ip || 'unknown';
        const ip = first.ip || target;
        const findings = data.map(toFinding);
        return { target, ip, findings };
        }
      if (data && typeof data === 'object') {
        const target = data.host || data.ip || 'unknown';
        const ip = data.ip || target;
        const findings = [toFinding(data)];
        return { target, ip, findings };
      }

      return null;
    } catch {
      // קבצי mock רבים מכילים טקסט פשוט (לא JSON) – להתעלם בשקט
      return null;
    }
  }

  // ===== aggregator =====
  async parseScanResults(
    container: string,
    targetPath: string,
    niktoContent: string,
    nmapContent: string,
    nucleiContent: string
  ): Promise<ScanSummary> {

    const nikto = this.parseNiktoCsv(niktoContent);
    const nmap = this.parseNmapXml(nmapContent);
    const nuclei = this.parseNucleiJson(nucleiContent);

    // ברירת מחדל מתוך הנתיב
    const fromPath = this.extractFromPath(targetPath);

    let target = 'unknown';
    let ip = 'unknown';
    let scanDate = fromPath.scanDate || new Date().toISOString();

    if (nmap) {
      target = nmap.target || fromPath.target;
      ip = nmap.ip || fromPath.ip;
    } else if (nikto) {
      target = nikto.target || fromPath.target;
      ip = nikto.ip || fromPath.ip;
    } else {
      target = fromPath.target;
      ip = fromPath.ip;
    }

    // ספירת חומרות (במקרה ש-Nuclei החזיר ממצאים)
    const findings = nuclei?.findings || [];
    const sevCount = (sev: string) => findings.filter(f => (f.severity || '').toLowerCase() === sev).length;

    const totalVulnerabilities =
      (nikto?.vulnerabilities?.length || 0) + (findings.length || 0);
    const openPorts = nmap?.ports?.length || 0;

    return {
      target,
      ip,
      scanDate,
      nikto: nikto || undefined,
      nmap: nmap || undefined,
      nuclei: nuclei || undefined,
      summary: {
        totalVulnerabilities,
        openPorts,
        criticalFindings: sevCount('critical'),
        highFindings: sevCount('high'),
        mediumFindings: sevCount('medium'),
        lowFindings: sevCount('low'),
      },
    };
  }
}
