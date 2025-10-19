// frontend/src/ui/ScanDetails.tsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

type RunItem = { date?: string; startedAt?: string; files?: string[] };

function normalizeTarget(t: string) {
 
  return (t || '').split('.').join('-'); // 10.0.0.5 -> 10-0-0-5
}

// 2025-09-10T07-41 כמו ISO לטובת תצוגה
function niceIsoFromFolder(df: string) {
  const m = df && df.match(/^(\d{4}-\d{2}-\d{2}T)(\d{2})-(\d{2})$/);
  return m ? `${m[1]}${m[2]}:${m[3]}` : df;
}

// להוציא את שם תיקיית התאריך מתוך נתיב blob
function extractFolder(name: string, id: string) {
 
  const m = (name || '').match(new RegExp('^scans/' + id.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '/([^/]+)/'));
  return m ? m[1] : null;
}

export default function ScanDetails() {
  const params = useParams();
  const rawId = params.id ?? '';          
  const id = normalizeTarget(rawId);      

  
  const foldersQ = useQuery({
    queryKey: ['folders', id],
    queryFn: async () => {
      const blobsJson = await api.blobs(`scans_${id}/`);
      const arr: any[] = Array.isArray(blobsJson?.value) ? blobsJson.value : Array.isArray(blobsJson) ? blobsJson : [];
      // הוצאת כל שמות התיקיות הייחודיים עבור היעד
      const set: Record<string, true> = {};
      for (const b of arr) {
        const name = String(b?.name || '');
        const folder = extractFolder(name, id);
        if (folder) set[folder] = true;
      }
      const folders = Object.keys(set);
      // ממיינים לפי זמן יורד (מבנה התיקייה מאפשר השוואה מילולית)
      folders.sort();
      folders.reverse();
      return folders; 
    },
    enabled: !!id,
    refetchInterval: 3000, 
    staleTime: 0,
  });

  const latestFolder = (foldersQ.data && foldersQ.data[0]) || '';

  
  const summaryQ = useQuery({
    queryKey: ['summary', id, latestFolder],
    queryFn: () => api.reportSummary(id, latestFolder),
    enabled: !!id && !!latestFolder,
    refetchInterval: 3000, // עדיף שנראה עדכונים בזמן אמת
    staleTime: 0,
  });

  
  const filesQ = useQuery({
    queryKey: ['files', id, latestFolder],
    queryFn: async () => {
      const j = await api.blobs(`scans_${id}/${latestFolder}/`);
      const arr: any[] = Array.isArray(j?.value) ? j.value : Array.isArray(j) ? j : [];
      return arr.map((x) => x?.name).filter(Boolean);
    },
    enabled: !!id && !!latestFolder,
    refetchInterval: 3000,
    staleTime: 0,
  });

  const isLoading = foldersQ.isLoading || (latestFolder && summaryQ.isLoading);
  const error = foldersQ.error || summaryQ.error;

  return (
    <div className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Scan for {rawId}</h1>
          <div className="muted">
            {isLoading ? 'Loading…' : (foldersQ.isFetching || summaryQ.isFetching || filesQ.isFetching) ? 'Updating…' : ' '}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="btn" to="/scans">Back</Link>
        </div>
      </div>

      {/* מצב שגיאה */}
      {error ? (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ color: 'tomato' }}>
            Failed to load scan data
          </div>
        </div>
      ) : null}

      {/* אין עדיין תיקיות */}
      {!isLoading && !error && !latestFolder ? (
        <div className="card" style={{ marginTop: 12 }}>
          <div>לא נמצאו תוצאות סריקה עדיין ל־{id}. ממתין לעדכון…</div>
        </div>
      ) : null}

      {/* תצוגת Summary */}
      {!!latestFolder && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={{ margin: 0 }}>Latest: {niceIsoFromFolder(latestFolder)}</h2>
            <a
              className="btn"
              href={`/api/storage/reports/${encodeURIComponent(id)}/${encodeURIComponent(latestFolder)}/summary`}
              target="_blank"
              rel="noreferrer"
            >
              View raw JSON
            </a>
          </div>

          {summaryQ.isLoading ? (
            <div style={{ padding: '8px 0' }}>טוען תקציר…</div>
          ) : summaryQ.data ? (
            <>
              <table className="table" style={{ marginTop: 8 }}>
                <tbody>
                  <tr>
                    <th style={{ width: 220 }}>Target</th>
                    <td>{summaryQ.data.target || id}</td>
                  </tr>
                  <tr>
                    <th>Scan date</th>
                    <td>{summaryQ.data.scanDate ? new Date(summaryQ.data.scanDate).toLocaleString() : niceIsoFromFolder(latestFolder)}</td>
                  </tr>
                  <tr>
                    <th>Total vulns (nikto)</th>
                    <td>{summaryQ.data.summary?.totalVulnerabilities ?? 0}</td>
                  </tr>
                  <tr>
                    <th>Credentials found</th>
                    <td>{summaryQ.data.additionalData?.credentials?.total ?? 0}</td>
                  </tr>
                  <tr>
                    <th>SQLi paths tested</th>
                    <td>{(summaryQ.data.additionalData?.sqlmap?.pathsTested || []).join(', ') || '—'}</td>
                  </tr>
                </tbody>
              </table>

              {}
              {Array.isArray(summaryQ.data.nikto?.vulnerabilities) && summaryQ.data.nikto.vulnerabilities.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h3 style={{ margin: '8px 0' }}>Nikto findings</h3>
                  <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                    {summaryQ.data.nikto.vulnerabilities.slice(0, 10).map((v: any, i: number) => (
                      <li key={i}>
                        <code>{v.path || '/'}</code> – {v.description || ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '8px 0' }}>לא התקבל תקציר.</div>
          )}
        </div>
      )}

      {}
      {!!latestFolder && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Files in folder</h3>
          {filesQ.isLoading ? (
            <div>טוען…</div>
          ) : filesQ.data && filesQ.data.length > 0 ? (
            <ul style={{ margin: 0, paddingInlineStart: 18 }}>
              {filesQ.data.map((n: string, i: number) => (
                <li key={i}>
                  <code>{n}</code>
                </li>
              ))}
            </ul>
          ) : (
            <div>אין קבצים להצגה.</div>
          )}
        </div>
      )}
    </div>
  );
}
