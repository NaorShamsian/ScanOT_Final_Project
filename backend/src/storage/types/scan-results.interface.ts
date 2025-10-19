export interface NiktoResult {
  target: string;
  ip: string;
  port: string;
  vulnerabilities: {
    id: string;
    method: string;
    path: string;
    description: string;
  }[];
}

export interface NmapResult {
  target: string;
  ip: string;
  ports: {
    port: number;
    protocol: string;
    state: string;
    service: string;
    version?: string;
  }[];
}

export interface NucleiResult {
  target: string;
  ip: string;
  findings: {
    template: string;
    severity: string;
    description: string;
    reference?: string;
  }[];
}

export interface ScanSummary {
  target: string;
  ip: string;
  scanDate: string;
  nikto?: NiktoResult;
  nmap?: NmapResult;
  nuclei?: NucleiResult;
  summary: {
    totalVulnerabilities: number;
    openPorts: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
  };
}
