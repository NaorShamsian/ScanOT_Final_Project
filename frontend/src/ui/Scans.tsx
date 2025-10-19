// frontend/src/ui/Scans.tsx
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

type ScanRow = { target: string; startedAt?: string }


const norm = (v: string) => (v || '').split('.').join('-')
const pretty = (v: string) => (/^\d+-\d+-\d+-\d+$/.test(v) ? v.split('-').join('.') : v)


const folderFromIso = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}`
}


const DATE_RE = /(\d{4})[-_](\d{2})[-_](\d{2})T(\d{2})[-_](\d{2})(?:[-_](\d{2}))?/
const isFolderFmt = (s: string) => /^\d{4}[-_]\d{2}[-_]\d{2}T\d{2}[-_]\d{2}(?:[-_]\d{2})?$/.test(s)


const parseWhen = (val?: string): number => {
  if (!val) return 0
  const m = val.match(DATE_RE)
  if (m) {
    const [ , Y, M, D, h, mnt, s ] = m
    const ts = Date.parse(`${Y}-${M}-${D}T${h}:${mnt}:${s ?? '00'}Z`)
    return Number.isFinite(ts) ? ts : 0
  }
  const ts = Date.parse(val)
  return Number.isFinite(ts) ? ts : 0
}


const stdFolder = (val?: string): string => {
  if (!val) return ''

  const m = val.match(DATE_RE)
  if (m) {
    const [ , Y, M, D, h, mnt ] = m
    return `${Y}-${M}-${D}T${h}-${mnt}`
  }

  const ts = parseWhen(val)
  if (ts) {
    const d = new Date(ts)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}`
  }
  // לא הצלחנו לנרמל — נחזיר ריק כדי לא לזהם מפתח דדופ
  return ''
}


const rowKey = (r: ScanRow): string => {
  const t = norm(pretty(r.target || ''))
  const f = stdFolder(r.startedAt)
  return `${t}|${f}`
}

// תצוגת תאריך יפה (לוקאל)
const formatDate = (val?: string) => {
  if (!val) return '—'
  const ts = parseWhen(val)
  if (ts) return new Date(ts).toLocaleString()
  return val
}


const buildSummaryUrl = (target?: string, startedAt?: string) => {
  if (!target || !startedAt) return ''
  const t = norm(target)
  let folder = stdFolder(startedAt)
  if (!folder) return ''
  return `/api/storage/reports/${encodeURIComponent(t)}/${encodeURIComponent(folder)}/summary`
}


const toRowsFromAvailable = (res: unknown): ScanRow[] => {
  if (!res) return []
  const list: any[] = Array.isArray(res) ? res : (Array.isArray((res as any).scans) ? (res as any).scans : [])
  const rows = list.map((x: any): ScanRow => ({
    target: x?.target ?? x?.ip ?? '',
    startedAt: x?.startedAt ?? x?.date ?? x?.scanDate ?? x?.createdAt ?? x?.timestamp ?? x?.time,
  })).filter(r => r.target)

  // דדופ פנימי על בסיס מפתח מנורמל
  const seen = new Set<string>()
  return rows.filter(r => {
    const k = rowKey(r)
    if (!k || seen.has(k)) return false
    seen.add(k); return true
  })
}


const normalizeBlobList = (res: unknown): string[] => {
  const pick = (arr: any[]): string[] =>
    arr.map(it => typeof it === 'string' ? it : (it?.name ?? it?.key ?? it?.path ?? it?.url ?? ''))
      .filter(Boolean)

  if (Array.isArray(res)) return pick(res as any[])
  if (res && typeof res === 'object') {
    const obj: any = res
    if (Array.isArray(obj.items)) return pick(obj.items)
    if (Array.isArray(obj.blobs)) return pick(obj.blobs)
  }
  return []
}


const extractFromName = (name: string): ScanRow | null => {
  let m = name.match(/^(?:scans|reports)\/([^/]+)\/([^/]+)\//)
  if (m) {
    const targetSeg = pretty(m[1])
    const folderSeg = m[2]
    const std = stdFolder(folderSeg)
    if (std) return { target: targetSeg, startedAt: std }
  }
  m = name.match(/^scans\/scans_([^_]+)_(\d{4}[-_]\d{2}[-_]\d{2}T\d{2}[-_]\d{2}(?:[-_]\d{2})?)/)
  if (m) return { target: pretty(m[1]), startedAt: stdFolder(m[2]) }

  const dm = name.match(DATE_RE)
  if (dm) {
    const upto = name.indexOf(dm[0])
    const before = upto > 0 ? name.slice(0, upto) : name
    const parts = before.split('/')
    const last = parts.filter(Boolean).pop() || ''
    const tgt = last && !DATE_RE.test(last) ? last : (parts.length > 1 ? parts[parts.length - 2] : last)
    if (tgt) return { target: pretty(tgt.replace(/^scans_/, '')), startedAt: stdFolder(dm[0]) }
  }
  return null
}

const toRowsFromBlobs = (res: unknown): ScanRow[] => {
  const items = normalizeBlobList(res)
  const rows: ScanRow[] = []
  for (const name of items) {
    const r = extractFromName(name)
    if (r) rows.push(r)
  }
  // דדופ פנימי על בסיס מפתח מנורמל
  const seen = new Set<string>()
  return rows.filter(r => {
    const k = rowKey(r)
    if (!k || seen.has(k)) return false
    seen.add(k); return true
  })
}


export default function Scans() {
  const { data, isLoading, error, isFetching } = useQuery<ScanRow[]>({
    queryKey: ['scan-history'],
    queryFn: async () => {
    
      const official = toRowsFromAvailable(await api.scans())

      
      let agg: ScanRow[] = [...official]
      if (!official.length) {
        const prefixes = ['scans/', 'reports/']
        for (const p of prefixes) {
          try {
            const blobs = await api.blobs(p)
            agg = agg.concat(toRowsFromBlobs(blobs))
          } catch {}
        }
      }

      
      const seen = new Set<string>()
      const unique = agg.filter(r => {
        const k = rowKey(r)
        if (!k || seen.has(k)) return false
        seen.add(k)
        return true
      })

      return unique
    },
    refetchInterval: 5000,
    staleTime: 0,
  })

  const lastFive = useMemo(() => {
    const list = Array.isArray(data) ? data : []
    return [...list]
      .sort((a, b) => parseWhen(b.startedAt) - parseWhen(a.startedAt))
      .slice(0, 5)
  }, [data])

  const isUnauthorized = (err: unknown) => {
    const e: any = err
    const s = e?.response?.status ?? e?.status
    return s === 401 || e?.message === 'Unauthorized'
  }

  return (
    <div className="container">
      <div className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h1 style={{ margin:0 }}>Scan History</h1>
          <div className="muted">{isFetching ? 'Updating…' : ' '}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        {isLoading ? (
          <div className="spinner"/>
        ) : error ? (
          isUnauthorized(error) ? (
            <div>Login required.</div>
          ) : (
            <div>Failed to load scans</div>
          )
        ) : lastFive.length === 0 ? (
          <div>No scans yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Target</th>
                <th>Date</th>
                <th>JSON</th>
              </tr>
            </thead>
            <tbody>
              {lastFive.map((r) => {
                const url = buildSummaryUrl(r.target, r.startedAt)
                const key = rowKey(r) || `${r.target}-${r.startedAt ?? ''}`
                return (
                  <tr key={key}>
                    <td>{pretty(r.target) || '—'}</td>
                    <td>{formatDate(r.startedAt)}</td>
                    <td>
                      {url
                        ? <a className="btn" href={url} target="_blank" rel="noreferrer">Open JSON</a>
                        : <span style={{ opacity:.6 }}>—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
