import { useState, useEffect } from 'react'
import { listAccounts, submitOverdraft, getOverdraft } from '../api/accounts'

interface Account { account_id: string; account_number: string; type: string }

const STATUS: Record<string, { bg: string; text: string; icon: string }> = {
  PENDING:  { bg: '#fef9c3', text: '#854d0e', icon: '⏳' },
  APPROVED: { bg: '#dcfce7', text: '#166534', icon: '✅' },
  REJECTED: { bg: '#fee2e2', text: '#991b1b', icon: '❌' },
}

export default function Overdraft() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selected, setSelected] = useState('')
  const [existing, setExisting] = useState<any>(null)
  const [form, setForm] = useState({ requested_limit: '', reason: '', monthly_income: '', employment_status: 'EMPLOYED' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listAccounts().then(({ data }) => {
      const items = data.data.items
      setAccounts(items)
      if (items.length > 0) setSelected(items[0].account_id)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    getOverdraft(selected).then(({ data }) => setExisting(data.data)).catch(() => setExisting(null))
  }, [selected])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await submitOverdraft(selected, {
        requested_limit: parseFloat(form.requested_limit),
        reason: form.reason,
        monthly_income: parseFloat(form.monthly_income),
        employment_status: form.employment_status,
        consent: true,
      })
      setExisting(data.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Submission failed')
    } finally { setLoading(false) }
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', fontSize: '15px',
    border: '2px solid #e2e8f0', borderRadius: '10px', background: 'white',
    color: '#1e293b', outline: 'none',
  }

  return (
    <div style={{ maxWidth: '760px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f2444', marginBottom: '4px' }}>Overdraft Request</h1>
        <p style={{ color: '#64748b', fontSize: '15px' }}>Apply for an overdraft limit increase on a selected account.</p>
      </div>

      {accounts.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Account</label>
          <select value={selected} onChange={e => { setSelected(e.target.value); setExisting(null) }} style={inputStyle}>
            {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.type.replace(/_/g,' ')} — ••••{a.account_number.slice(-4)}</option>)}
          </select>
        </div>
      )}

      {existing ? (
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Existing Request</div>
            {(() => { const s = STATUS[existing.status] || STATUS.PENDING; return (
              <span style={{ padding: '8px 18px', borderRadius: '24px', fontSize: '14px', fontWeight: 700, background: s.bg, color: s.text }}>
                {s.icon} {existing.status}
              </span>
            )})()}
          </div>
          <div style={{ padding: '28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, marginBottom: '4px' }}>Requested Limit</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>${parseFloat(existing.requested_limit).toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, marginBottom: '4px' }}>Submitted</div>
              <div style={{ fontSize: '16px', fontWeight: 500, color: '#475569' }}>{new Date(existing.submitted_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && <div style={{ padding: '14px 16px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', color: '#991b1b', fontSize: '15px' }}>{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Requested Limit ($)</label>
              <input type="number" min="1" step="0.01" value={form.requested_limit} onChange={set('requested_limit')} required style={inputStyle} placeholder="500.00" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Income ($)</label>
              <input type="number" min="0" step="0.01" value={form.monthly_income} onChange={set('monthly_income')} required style={inputStyle} placeholder="5000.00" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employment Status</label>
            <select value={form.employment_status} onChange={set('employment_status')} style={inputStyle}>
              <option value="EMPLOYED">Employed</option>
              <option value="SELF_EMPLOYED">Self-Employed</option>
              <option value="UNEMPLOYED">Unemployed</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reason for Request <span style={{ color: '#94a3b8', textTransform: 'none' }}>(min 10 chars)</span></label>
            <textarea value={form.reason} onChange={set('reason')} required rows={4}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
              placeholder="Describe why you need an overdraft limit increase…" />
          </div>

          <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
            By submitting this request, you confirm that all information provided is accurate and you consent to a credit review. Submission does not guarantee approval.
          </div>

          <button type="submit" disabled={loading} style={{
            padding: '16px', background: 'linear-gradient(135deg, #1b3f6e, #0f2444)',
            color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px',
            fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Submitting…' : 'Submit Overdraft Request'}
          </button>
        </form>
      )}
    </div>
  )
}
