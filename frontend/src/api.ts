// frontend/src/api.ts
const BASE = (import.meta as any)?.env?.VITE_API_URL || '/api';

async function req(path: string, options: RequestInit = {}) {
  const res = await fetch(BASE + path, { credentials: 'include', ...options });
  if (!res.ok) {
    if (res.status === 401) {
      const r = await fetch(BASE + '/authentication/refresh-tokens', {
        method: 'POST',
        credentials: 'include',
      });
      if (r.ok) return req(path, options);
    }
    let msg = 'Request failed';
    try {
      const j = await res.json();
      msg = (j && j.message) || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  signup: (b: any) =>
    req('/authentication/sign-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b),
    }),
   signin: async (b: any) =>{
    try{
     const response = await req('/authentication/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b),
    })
  if(!response.ok){
    console.log('resp case')
  }
  }
    catch(e: unknown){
      throw e
    }
  },
  refresh: () => req('/authentication/refresh-tokens', { method: 'POST' }),

  // רשימת "סריקות זמינות" (אם תחזור)
  scans: () => req('/storage/available-scans'),

  // נתוני יעד (אם קיים)
  scanTarget: (id: string) => req('/storage/scan-data/' + encodeURIComponent(id)),

  // שליפת הבלוב הספציפי
  blobs: (prefix: string) =>
    req('/storage/scans/blobs?prefix=' + encodeURIComponent(prefix)),

  //  תקציר סריקה לפי יעד ותיקייה
  reportSummary: (target: string, folder: string) =>
    req(
      '/storage/reports/' +
        encodeURIComponent(target) +
        '/' +
        encodeURIComponent(folder) +
        '/summary',
    ),

  // הזנקת סריקה 
  startScan: (b: any) =>
    req('/storage/azure-scanner/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b),
    }),
};
