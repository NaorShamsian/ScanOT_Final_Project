
export type Me = { id: string; nickname: string; firstName?: string; lastName?: string }
export type TargetScan = { target: string; date?: string; type?: 'infra'|'app'; status?: string; id?: string }
export type Finding = { id: string; title: string; severity: 'low'|'medium'|'high'|'critical'; scanId?: string }
