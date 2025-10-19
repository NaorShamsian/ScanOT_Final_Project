
import { Navigate, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import Spinner from './Spinner'

export default function ProtectedRoute() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['auth-check'],
    queryFn: async () => {
      try { return await api.post<any>('/authentication/refresh-tokens') } catch { return null }
    },
    retry: 0
  })
  if (isLoading) return <div className="container"><Spinner /></div>
  if (isError || !data) return <Navigate to="/login" replace />
  return <Outlet />
}
