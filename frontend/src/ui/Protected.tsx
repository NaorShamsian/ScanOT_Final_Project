
import { Outlet, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api'
export default function Protected(){
  const [ok,setOk]=useState<boolean|null>(null)
  useEffect(()=>{ api.refresh().then(()=>setOk(true)).catch(()=>setOk(false)) },[])
  if(ok===null) return <div className="container"><div className="spinner"/></div>
  if(ok===false) return <Navigate to="/login" replace/>
  return <Outlet/>
}
