
const BASE_URL = import.meta.env.VITE_API_URL as string
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
async function request<T>(path: string, method: HttpMethod = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal
  })
  if (!res.ok) {
    if (res.status === 401) {
      const refreshed = await tryRefresh()
      if (refreshed) return request<T>(path, method, body, signal)
    }
    let err: any; try { err = await res.json() } catch { err = { message: 'Unknown error' } }
    throw new Error(err.message ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
export const api = {
  get:  <T>(p: string) => request<T>(p, 'GET'),
  post: <T>(p: string, b?: unknown) => request<T>(p, 'POST', b),
  put:  <T>(p: string, b?: unknown) => request<T>(p, 'PUT', b),
  patch:<T>(p: string, b?: unknown) => request<T>(p, 'PATCH', b),
  del:  <T>(p: string) => request<T>(p, 'DELETE'),
}
let refreshing = false
async function tryRefresh(): Promise<boolean> {
  if (refreshing) return false
  refreshing = true
  try {
    const res = await fetch(`${BASE_URL}/authentication/refresh-tokens`, { method: 'POST', credentials: 'include' })
    return res.ok
  } catch {
    return false
  } finally {
    refreshing = false
  }
}
export function setupTokenRefresh() {
  setInterval(async () => { await tryRefresh() }, 10 * 60 * 1000)
}
