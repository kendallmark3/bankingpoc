import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StockTicker from './StockTicker'
import logo from '../assets/images/bofi-logo.svg'

const navItems = [
  { to: '/dashboard', label: 'Dashboard',           icon: '⊞' },
  { to: '/profile',   label: 'Profile',              icon: '👤' },
  { to: '/accounts',  label: 'Accounts',             icon: '🏦' },
  { to: '/balances',  label: 'Balances',             icon: '💰' },
  { to: '/overdraft', label: 'Overdraft Requests',   icon: '📋' },
  { to: '/watchlist', label: 'Watchlist',            icon: '📈' },
  { to: '/stock-tip', label: 'Stock Tip',            icon: '💡' },
]

export default function Layout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f1f5f9' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '280px',
        minWidth: '280px',
        background: 'linear-gradient(180deg, #0a1f3d 0%, #0f2444 60%, #0a1b35 100%)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.35)',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <img src={logo} alt="Bank of Intent" style={{ width: '100%', maxHeight: '56px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.95 }} />
          <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '10px', letterSpacing: '3px', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase', fontWeight: 600 }}>
            Secure Banking Portal
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                transition: 'all 0.15s',
                background: isActive ? 'linear-gradient(135deg, #c9a84c, #b8942a)' : 'transparent',
                color: isActive ? '#0f2444' : 'rgba(203,213,225,0.85)',
                boxShadow: isActive ? '0 4px 12px rgba(201,168,76,0.3)' : 'none',
              })}
            >
              <span style={{ fontSize: '16px', lineHeight: 1 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <NavLink to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 16px', borderRadius: '10px', fontSize: '15px', color: 'rgba(148,163,184,0.8)', textDecoration: 'none' }}>
            <span>⚙️</span> Settings
          </NavLink>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '11px 16px', borderRadius: '10px', fontSize: '15px',
            color: 'rgba(248,113,113,0.8)', background: 'transparent',
            border: 'none', cursor: 'pointer', textAlign: 'left',
          }}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Header */}
        <header style={{
          background: 'linear-gradient(90deg, #1b3f6e 0%, #1e4a80 100%)',
          color: 'white',
          padding: '0 32px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          flexShrink: 0,
          zIndex: 5,
        }}>
          <span style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)', fontWeight: 600 }}>
            Live Market
          </span>
          <StockTicker />
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '36px 40px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
