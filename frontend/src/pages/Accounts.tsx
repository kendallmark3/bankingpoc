import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAccounts } from '../api/accounts'

interface Account { account_id: string; account_number: string; type: string; status: string; created_at: string }

const STATUS: Record<string, { bg: string; text: string }> = {
  ACTIVE:   { bg: '#dcfce7', text: '#166534' },
  PENDING:  { bg: '#fef9c3', text: '#854d0e' },
  REJECTED: { bg: '#fee2e2', text: '#991b1b' },
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAccounts().then(({ data }) => setAccounts(data.data.items)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '16px' }}>Loading accounts…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f2444', marginBottom: '4px' }}>My Accounts</h1>
          <p style={{ color: '#64748b', fontSize: '15px' }}>{accounts.length} account{accounts.length !== 1 ? 's' : ''} on file</p>
        </div>
        <Link to="/accounts/new" style={{
          background: 'linear-gradient(135deg, #c9a84c, #b8942a)', color: '#0f2444',
          padding: '12px 24px', borderRadius: '10px', fontSize: '15px',
          fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(201,168,76,0.3)',
        }}>
          + Open Account
        </Link>
      </div>

      {accounts.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏦</div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>No accounts yet</h2>
          <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '15px' }}>Open your first account to get started.</p>
          <Link to="/accounts/new" style={{ background: '#1b3f6e', color: 'white', padding: '12px 28px', borderRadius: '10px', fontWeight: 600, textDecoration: 'none', fontSize: '15px' }}>
            Open Account
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {accounts.map(a => {
            const s = STATUS[a.status] || { bg: '#f1f5f9', text: '#475569' }
            return (
              <div key={a.account_id} style={{
                background: 'white', borderRadius: '16px', padding: '24px 28px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
                borderLeft: '5px solid #1b3f6e',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, #0f2444, #1b3f6e)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                    🏦
                  </div>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                      {a.type.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b', fontFamily: 'monospace', letterSpacing: '1px' }}>
                      Acct •••• {a.account_number.slice(-4)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>Opened</div>
                    <div style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>{new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                  <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, background: s.bg, color: s.text }}>
                    {a.status}
                  </span>
                  <Link to={`/balances?account=${a.account_id}`} style={{
                    background: '#f1f5f9', color: '#1b3f6e', padding: '10px 20px',
                    borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    textDecoration: 'none', border: '1px solid #e2e8f0',
                  }}>
                    Balance →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
