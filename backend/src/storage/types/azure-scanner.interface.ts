export interface IAzureScannerHealthResponse {
  ok: boolean;
}

export interface IAzureScannerScanResponse {
  ok: boolean;
  accepted: boolean;
  target: string;
}

export interface IAzureScannerTargetsResponse {
  ok: boolean;
  targets: string[];
  warnings: string[];
}

export interface IAzureScannerError {
  ok: false;
  error: string;
  message: string;
  timestamp: string;
}
