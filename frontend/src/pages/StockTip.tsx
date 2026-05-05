import { useEffect, useState } from 'react'
import { getTipOfDay } from '../api/stocks'

const RISK: Record<string, { bg: string; text: string; border: string }> = {
  LOW:    { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  MEDIUM: { bg: '#fef9c3', text: '#854d0e', border: '#fef08a' },
  HIGH:   { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
}

export default function StockTip() {
  const [tip, setTip] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTipOfDay().then(({ data }) => setTip(data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '16px' }}>Loading tip…</div>

  const r = RISK[tip?.risk_level] || RISK.MEDIUM

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f2444', marginBottom: '4px' }}>Stock Tip of the Day</h1>
        <p style={{ color: '#64748b', fontSize: '15px' }}>Curated market insights for {tip.effective_date}</p>
      </div>

      {/* Hero card */}
      <div style={{ background: 'linear-gradient(135deg, #0f2444 0%, #1b3f6e 100%)', borderRadius: '20px', padding: '36px', marginBottom: '24px', boxShadow: '0 8px 32px rgba(15,36,68,0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '42px', fontWeight: 800, color: 'white', letterSpacing: '-1px', marginBottom: '4px' }}>{tip.symbol}</div>
            <div style={{ fontSize: '16px', color: 'rgba(148,163,184,0.8)' }}>{tip.company_name}</div>
          </div>
          <span style={{ padding: '8px 18px', borderRadius: '24px', fontSize: '14px', fontWeight: 700, background: r.bg, color: r.text, border: `1px solid ${r.border}` }}>
            {tip.risk_level} RISK
          </span>
        </div>
        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.65, fontWeight: 400 }}>
          {tip.tip_summary}
        </p>
      </div>

      {/* Reasoning */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '12px', letterSpacing: '1.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '14px' }}>
          Analyst Reasoning
        </div>
        <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.7 }}>{tip.reasoning}</p>
      </div>

      {/* Disclaimer */}
      <div style={{ background: '#fef9c3', border: '1px solid #fef08a', borderRadius: '12px', padding: '18px 22px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
        <p style={{ fontSize: '13px', color: '#854d0e', lineHeight: 1.6, margin: 0 }}>{tip.disclaimer}</p>
      </div>
    </div>
  )
}
