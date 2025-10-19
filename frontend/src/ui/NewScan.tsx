import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function NewScan(){
  const nav = useNavigate()
  const [target, setTarget] = useState('')
  const [isSubmitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string|null>(null)

  async function submit(e:React.FormEvent){
    e.preventDefault()
    if(!target.trim()) { setError('Please enter a target'); return }
    setSubmitting(true); setError(null)
    try{
      const res = await api.startScan({ target })
      const t = (res && typeof res==='object' && 'target' in res && (res as any).target) ? (res as any).target : target
      nav(`/scans/${encodeURIComponent(t)}`)
    }catch(err:any){
      setError(err?.message || 'Failed to start scan')
    }finally{
      setSubmitting(false)
    }
  }

  return (
    <div className="container" style={{maxWidth:520}}>
      <h1>New Scan</h1>
      <form onSubmit={submit} className="card" style={{display:'grid',gap:10}}>
        <input className="input" placeholder="Target IP (e.g. 10.0.0.4)" value={target} onChange={e=>setTarget(e.target.value)} required disabled={isSubmitting}/>
        {error && <div className="card" style={{background:'#ffecec',color:'#900'}}> {error} </div>}
        <button className="btn" disabled={isSubmitting}>{isSubmitting? 'Starting…' : 'Start'}</button>
      </form>
    </div>
  )
}
