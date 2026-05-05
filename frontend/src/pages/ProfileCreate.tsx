import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProfile } from '../api/profile'

export default function ProfileCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', date_of_birth: '', tax_id_last4: '',
    line1: '', city: '', state: '', postal_code: '', country: 'US',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createProfile({
        first_name: form.first_name, last_name: form.last_name,
        phone: form.phone, date_of_birth: form.date_of_birth, tax_id_last4: form.tax_id_last4,
        address: { line1: form.line1, city: form.city, state: form.state, postal_code: form.postal_code, country: form.country },
      })
      navigate('/accounts/new')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(Array.isArray(detail) ? detail.map((d: any) => d.msg).join(' · ') : detail || 'Failed to save profile')
    } finally { setLoading(false) }
  }

  const inputStyle = {
    width: '100%', padding: '13px 16px', fontSize: '15px',
    border: '2px solid #e2e8f0', borderRadius: '10px', background: 'white',
    color: '#1e293b', outline: 'none',
  }
  const label = (text: string) => (
    <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '7px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
      {text}
    </div>
  )

  return (
    <div style={{ maxWidth: '840px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f2444', marginBottom: '4px' }}>Complete Your Profile</h1>
        <p style={{ color: '#64748b', fontSize: '15px' }}>We need a few details before you can open accounts.</p>
      </div>

      {error && <div style={{ marginBottom: '20px', padding: '14px 16px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', color: '#991b1b', fontSize: '15px' }}>{error}</div>}

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Personal */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '20px' }}>Personal Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>{label('First Name')}<input value={form.first_name} onChange={set('first_name')} required style={inputStyle} /></div>
            <div>{label('Last Name')}<input value={form.last_name} onChange={set('last_name')} required style={inputStyle} /></div>
            <div>{label('Phone Number')}<input type="tel" value={form.phone} onChange={set('phone')} required style={inputStyle} placeholder="+1 (555) 000-0000" /></div>
            <div>{label('Date of Birth')}<input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} required style={inputStyle} /></div>
            <div>{label('Last 4 digits of SSN/Tax ID')}<input value={form.tax_id_last4} onChange={set('tax_id_last4')} required maxLength={4} placeholder="1234" style={inputStyle} /></div>
          </div>
        </div>

        {/* Address */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '20px' }}>Address</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1/-1' }}>{label('Street Address')}<input value={form.line1} onChange={set('line1')} required style={inputStyle} /></div>
            <div>{label('City')}<input value={form.city} onChange={set('city')} required style={inputStyle} /></div>
            <div>{label('State (2-letter)')}<input value={form.state} onChange={set('state')} required maxLength={2} placeholder="CA" style={inputStyle} /></div>
            <div>{label('Postal Code')}<input value={form.postal_code} onChange={set('postal_code')} required style={inputStyle} /></div>
            <div>{label('Country (ISO)')}<input value={form.country} onChange={set('country')} required maxLength={2} style={inputStyle} /></div>
          </div>
        </div>

        <button type="submit" disabled={loading} style={{
          padding: '16px', fontSize: '16px', fontWeight: 700,
          background: loading ? '#94a3b8' : 'linear-gradient(135deg, #1b3f6e, #0f2444)',
          color: 'white', border: 'none', borderRadius: '12px',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(15,36,68,0.35)',
        }}>
          {loading ? 'Saving profile…' : 'Save Profile & Continue →'}
        </button>
      </form>
    </div>
  )
}
