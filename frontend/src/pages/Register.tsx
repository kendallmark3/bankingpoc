import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import logo from '../assets/images/bofi-logo.svg'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(email, password)
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally { setLoading(false) }
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', fontSize: '16px',
    border: '2px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc',
    color: '#1e293b', outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a1f3d 0%, #0f2444 50%, #1b3f6e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ marginBottom: '36px', textAlign: 'center' }}>
          <img src={logo} alt="Bank of Intent" style={{ height: '64px', filter: 'brightness(0) invert(1)' }} />
          <div style={{ marginTop: '10px', fontSize: '12px', letterSpacing: '3px', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase', fontWeight: 600 }}>
            Secure Banking Portal
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f2444', marginBottom: '6px' }}>Create Account</h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '28px' }}>Join Bank of Intent today</p>

          {error && (
            <div style={{ marginBottom: '20px', padding: '14px 16px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', color: '#991b1b', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus style={inputStyle} placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} placeholder="Min 8 chars, 1 uppercase, 1 digit" />
            </div>
            <div style={{ padding: '12px 14px', background: '#f0f9ff', borderRadius: '8px', fontSize: '13px', color: '#0369a1' }}>
              Password requirements: at least 8 characters, one uppercase letter, one digit.
            </div>
            <button type="submit" disabled={loading} style={{
              marginTop: '8px', padding: '16px', fontSize: '16px', fontWeight: 700,
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #1b3f6e, #0f2444)',
              color: 'white', border: 'none', borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(15,36,68,0.4)',
            }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '15px', color: '#64748b' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#1b3f6e', fontWeight: 600, textDecoration: 'none' }}>Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
