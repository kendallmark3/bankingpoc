import { useEffect, useState } from 'react'
import { getQuotes } from '../api/stocks'

interface Quote { symbol: string; price: number; change: number; percent_change: number }

export default function StockTicker() {
  const [quotes, setQuotes] = useState<Quote[]>([])

  useEffect(() => {
    const fetch = async () => {
      try { const { data } = await getQuotes(); setQuotes(data.data) } catch {}
    }
    fetch()
    const id = setInterval(fetch, 45000)
    return () => clearInterval(id)
  }, [])

  if (!quotes.length) return <div style={{ fontSize: '13px', color: 'rgba(148,163,184,0.5)' }}>Loading quotes…</div>

  return (
    <div style={{ display: 'flex', gap: '28px', overflow: 'hidden' }}>
      {quotes.map(q => (
        <span key={q.symbol} style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.5px' }}>{q.symbol}</span>
          <span style={{ fontSize: '13px', color: 'rgba(203,213,225,0.8)', fontFamily: 'monospace' }}>${q.price.toFixed(2)}</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: q.change >= 0 ? '#4ade80' : '#f87171' }}>
            {q.change >= 0 ? '▲' : '▼'} {Math.abs(q.percent_change).toFixed(2)}%
          </span>
        </span>
      ))}
    </div>
  )
}
