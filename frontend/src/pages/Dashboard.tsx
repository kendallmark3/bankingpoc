import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProfile } from '../api/profile'
import { listAccounts } from '../api/accounts'
import { getTipOfDay } from '../api/stocks'

const RISK_BG: Record<string, string> = {
  LOW: '#dcfce7', MEDIUM: '#fef9c3', HIGH: '#fee2e2',
}
const RISK_TEXT: Record<string, string> = {
  LOW: '#166534', MEDIUM: '#854d0e', HIGH: '#991b1b',
}

const quickLinks = [
  { to: '/accounts/new', label: 'Open Account',       icon: '🏦', bg: '#0f2444' },
  { to: '/balances',     label: 'Check Balances',     icon: '💰', bg: '#1b3f6e' },
  { to: '/overdraft',    label: 'Overdraft Request',  icon: '📋', bg: '#2d5a8e' },
  { to: '/watchlist',    label: 'Stock Watchlist',    icon: '📈', bg: '#1e4a80' },
]

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [tip, setTip] = useState<any>(null)

  useEffect(() => {
    getProfile().then(({ data }) => setProfile(data.data)).catch(() => {})
    listAccounts().then(({ data }) => setAccounts(data.data.items)).catch(() => {})
    getTipOfDay().then(({ data }) => setTip(data.data)).catch(() => {})
  }, [])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Greeting */}
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#0f2444', marginBottom: '6px' }}>
          {greeting}{profile ? `, ${profile.first_name}` : ''}
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px' }}>
          {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Account cards */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Your Accounts</h2>
          <Link to="/accounts" style={{ fontSize: '14px', color: '#1b3f6e', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {accounts.slice(0, 4).map(a => (
            <Link key={a.account_id} to={`/balances?account=${a.account_id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, #0f2444 0%, #1b3f6e 100%)',
                borderRadius: '16px', padding: '24px',
                boxShadow: '0 4px 20px rgba(15,36,68,0.3)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(15,36,68,0.4)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(15,36,68,0.3)' }}
              >
                <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(201,168,76,0.8)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                  {a.type.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(148,163,184,0.8)', marginBottom: '4px' }}>Account Number</div>
                <div style={{ fontSize: '17px', fontWeight: 600, color: 'white', letterSpacing: '1px', fontFamily: 'monospace' }}>
                  •••• {a.account_number.slice(-4)}
                </div>
                <div style={{ marginTop: '20px', fontSize: '13px', color: 'rgba(201,168,76,0.9)', fontWeight: 500 }}>
                  View Balance →
                </div>
              </div>
            </Link>
          ))}
          <Link to="/accounts/new" style={{ textDecoration: 'none' }}>
            <div style={{
              border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '10px', minHeight: '148px', color: '#94a3b8',
              transition: 'border-color 0.15s, color 0.15s', cursor: 'pointer',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c9a84c'; (e.currentTarget as HTMLElement).style.color = '#c9a84c' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1'; (e.currentTarget as HTMLElement).style.color = '#94a3b8' }}
            >
              <span style={{ fontSize: '28px' }}>＋</span>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Open New Account</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom row: tip + quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Stock tip */}
        {tip && (
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '12px', letterSpacing: '1.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Stock Tip of the Day
              </div>
              <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: RISK_BG[tip.risk_level] || '#f1f5f9', color: RISK_TEXT[tip.risk_level] || '#475569' }}>
                {tip.risk_level} RISK
              </span>
            </div>
            <div style={{ padding: '16px 24px 24px' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#1b3f6e', marginBottom: '2px' }}>{tip.symbol}</div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>{tip.company_name}</div>
              <p style={{ fontSize: '15px', color: '#334155', lineHeight: 1.6, marginBottom: '16px' }}>{tip.tip_summary}</p>
              <Link to="/stock-tip" style={{ fontSize: '14px', color: '#1b3f6e', fontWeight: 600, textDecoration: 'none' }}>
                Full analysis →
              </Link>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignContent: 'start' }}>
          <div style={{ gridColumn: '1/-1', fontSize: '12px', letterSpacing: '1.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
            Quick Actions
          </div>
          {quickLinks.map(({ to, label, icon, bg }) => (
            <Link key={to} to={to} style={{ textDecoration: 'none' }}>
              <div style={{
                background: bg, borderRadius: '14px', padding: '20px',
                color: 'white', cursor: 'pointer',
                transition: 'filter 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1)' }}
              >
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>{icon}</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
