import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'

type Errors = Partial<Record<'nickname'|'firstName'|'lastName'|'password'|'form', string>>

export default function Register() {
  const nav = useNavigate()

  const [nickname, setNickname]   = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [password, setPassword]   = useState('')

  const [errors, setErrors]       = useState<Errors>({})
  const [loading, setLoading]     = useState(false)

  const validate = (): boolean => {
    const e: Errors = {}
    const n = nickname.trim()
    const f = firstName.trim()
    const l = lastName.trim()
    const p = password

    if (n.length < 1 || n.length > 16) e.nickname   = 'Nickname חייב להיות בין 1 ל-16 תווים'
    if (f.length < 1 || f.length > 16) e.firstName  = 'First name חייב להיות בין 1 ל-16 תווים'
    if (l.length < 1 || l.length > 16) e.lastName   = 'Last name חייב להיות בין 1 ל-16 תווים'
    if (p.length < 8 || p.length > 16) e.password   = 'Password חייב להיות בין 8 ל-16 תווים'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    if (!validate()) return

    setLoading(true)
    try {
      await api.signup({
        nickname: nickname.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      })
      alert('נרשמת בהצלחה! אפשר להתחבר כעת.')
      nav('/login')
    } catch (err: any) {
      const msg = err?.message || 'Registration failed'
      setErrors({ form: msg })
      console.error('Sign-up failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <h1>Create account</h1>

      <form onSubmit={submit} className="card" style={{ display: 'grid', gap: 10 }}>
        {}
        {errors.form && (
          <div style={{ color: '#ff6b6b', fontWeight: 600 }}>
            {errors.form}
          </div>
        )}

        <div>
          <label>Nickname</label>
          <input
            className="input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            minLength={1}
            maxLength={16}
            required
            aria-invalid={!!errors.nickname}
          />
          {errors.nickname && <small style={{ color: '#ff6b6b' }}>{errors.nickname}</small>}
        </div>

        <div className="row">
          <div style={{ flex: 1 }}>
            <label>First name</label>
            <input
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              minLength={1}
              maxLength={16}
              required
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && <small style={{ color: '#ff6b6b' }}>{errors.firstName}</small>}
          </div>

          <div style={{ flex: 1 }}>
            <label>Last name</label>
            <input
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              minLength={1}
              maxLength={16}
              required
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && <small style={{ color: '#ff6b6b' }}>{errors.lastName}</small>}
          </div>
        </div>

        <div>
          <label>Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            maxLength={16}
            required
            aria-invalid={!!errors.password}
          />
          {errors.password && <small style={{ color: '#ff6b6b' }}>{errors.password}</small>}
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Working…' : 'Register'}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}
