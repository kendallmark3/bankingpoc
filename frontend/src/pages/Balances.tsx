import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listAccounts, getBalance } from '../api/accounts'

interface Account { account_id: string; account_number: string; type: string }
interface Balance {
  current_balance: number; available_balance: number; pending_deposits: number
  pending_withdrawals: number; overdraft_limit: number; available_overdraft: number
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

const balanceCards = (b: Balance) => [
  { label: 'Current Balance',      value: b.current_balance,      icon: '💵', highlight: true },
  { label: 'Available Balance',    value: b.available_balance,    icon: '✅', highlight: true },
  { label: 'Pending Deposits',     value: b.pending_deposits,     icon: '⬆️', highlight: false },
  { label: 'Pending Withdrawals',  value: b.pending_withdrawals,  icon: '⬇️', highlight: false },
  { label: 'Overdraft Limit',      value: b.overdraft_limit,      icon: '🛡️', highlight: false },
  { label: 'Available Overdraft',  value: b.available_overdraft,  icon: '↔️', highlight: false },
]

export default function Balances() {
  const [params] = useSearchParams()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selected, setSelected] = useState<string>(params.get('account') || '')
  const [balance, setBalance] = useState<Balance | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listAccounts().then(({ data }) => {
      const items = data.data.items
      setAccounts(items)
      if (!selected && items.length > 0) setSelected(items[0].account_id)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    setBalance(null)
    getBalance(selected).then(({ data }) => setBalance(data.data)).finally(() => setLoading(false))
  }, [selected])

  const selectedAccount = accounts.find(a => a.account_id === selected)

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f2444', marginBottom: '4px' }}>Account Balances</h1>
        <p style={{ color: '#64748b', fontSize: '15px' }}>Real-time balance information computed server-side.</p>
      </div>

      {accounts.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Select Account
          </label>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={{
              width: '100%', maxWidth: '480px', padding: '14px 16px', fontSize: '16px',
              border: '2px solid #e2e8f0', borderRadius: '10px', background: 'white',
              color: '#1e293b', cursor: 'pointer', appearance: 'auto',
            }}
          >
            {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.type.replace(/_/g,' ')} — ••••{a.account_number.slice(-4)}</option>)}
          </select>
        </div>
      )}

      {selectedAccount && (
        <div style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #0f2444, #1b3f6e)', borderRadius: '16px', padding: '20px 28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '28px' }}>🏦</div>
          <div>
            <div style={{ color: 'rgba(201,168,76,0.9)', fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{selectedAccount.type.replace(/_/g,' ')}</div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 600, fontFamily: 'monospace', marginTop: '2px' }}>
              •••• {selectedAccount.account_number.slice(-4)}
            </div>
          </div>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>Loading balance…</div>}

      {balance && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {balanceCards(balance).map(({ label, value, icon, highlight }) => (
            <div key={label} style={{
              background: highlight ? 'linear-gradient(135deg, #0f2444, #1b3f6e)' : 'white',
              borderRadius: '16px', padding: '24px',
              boxShadow: highlight ? '0 4px 20px rgba(15,36,68,0.25)' : '0 1px 8px rgba(0,0,0,0.07)',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '12px' }}>{icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: highlight ? 'rgba(148,163,184,0.8)' : '#94a3b8', marginBottom: '6px' }}>{label}</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: highlight ? 'white' : '#1e293b', fontFamily: 'monospace' }}>
                {fmt(value)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
