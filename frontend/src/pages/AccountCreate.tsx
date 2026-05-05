import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAccount } from '../api/accounts'

const TYPES = [
  { value: 'CHECKING',     label: 'Checking Account',     desc: 'Everyday spending and bill payments', icon: '💳' },
  { value: 'SAVINGS',      label: 'Savings Account',      desc: 'Earn interest on your deposits',       icon: '🏦' },
  { value: 'MONEY_MARKET', label: 'Money Market Account', desc: 'Higher yields with limited access',    icon: '📊' },
]

export default function AccountCreate() {
  const navigate = useNavigate()
  const [type, setType] = useState('CHECKING')
  const [deposit, setDeposit] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createAccount(type, parseFloat(deposit || '0'))
      navigate('/accounts')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create account')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f2444', marginBottom: '4px' }}>Open a New Account</h1>
        <p style={{ color: '#64748b', fontSize: '15px' }}>Choose an account type and make your initial deposit.</p>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {error && <div style={{ padding: '14px 16px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', color: '#991b1b', fontSize: '15px' }}>{error}</div>}

        {/* Account type selector */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Type</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {TYPES.map(t => (
              <label key={t.value} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '18px 20px', borderRadius: '12px', cursor: 'pointer',
                border: `2px solid ${type === t.value ? '#1b3f6e' : '#e2e8f0'}`,
                background: type === t.value ? '#f0f4ff' : 'white',
                transition: 'all 0.15s',
              }}>
                <input type="radio" name="type" value={t.value} checked={type === t.value} onChange={() => setType(t.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '28px' }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>{t.label}</div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>{t.desc}</div>
                </div>
                {type === t.value && <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1b3f6e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>✓</div>}
              </label>
            ))}
          </div>
        </div>

        {/* Initial deposit */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Initial Deposit <span style={{ textTransform: 'none', color: '#94a3b8' }}>(optional)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#64748b', fontWeight: 600 }}>$</span>
            <input
              type="number" min="0" step="0.01" value={deposit}
              onChange={e => setDeposit(e.target.value)} placeholder="0.00"
              style={{ width: '100%', padding: '14px 16px 14px 32px', fontSize: '16px', border: '2px solid #e2e8f0', borderRadius: '10px', background: 'white', color: '#1e293b', outline: 'none' }}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} style={{
          padding: '16px', fontSize: '16px', fontWeight: 700,
          background: loading ? '#94a3b8' : 'linear-gradient(135deg, #c9a84c, #b8942a)',
          color: '#0f2444', border: 'none', borderRadius: '12px',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(201,168,76,0.35)',
        }}>
          {loading ? 'Opening account…' : 'Open Account'}
        </button>
      </form>
    </div>
  )
}
