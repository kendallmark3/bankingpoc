import { useEffect, useState } from 'react'
import { getQuotes, addToWatchlist, removeFromWatchlist } from '../api/stocks'

interface Quote { symbol: string; price: number; change: number; percent_change: number; cached: boolean }

const KNOWN = ['AAPL','MSFT','GOOGL','AMZN','NVDA','TSLA','META','JPM','BRK','V']

export default function Watchlist() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [symbol, setSymbol] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchQuotes = async () => {
    try { const { data } = await getQuotes(); setQuotes(data.data) } catch {}
  }

  useEffect(() => { fetchQuotes() }, [])

  const add = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    setError('')
    setAdding(true)
    try {
      await addToWatchlist(symbol.toUpperCase())
      setSymbol('')
      await fetchQuotes()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add symbol')
    } finally { setAdding(false) }
  }

  const remove = async (sym: string) => {
    await removeFromWatchlist(sym)
    await fetchQuotes()
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f2444', marginBottom: '4px' }}>Stock Watchlist</h1>
        <p style={{ color: '#64748b', fontSize: '15px' }}>Track up to 10 stocks. Quotes refresh every 45 seconds.</p>
      </div>

      {/* Add form */}
      <form onSubmit={add} style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <input
            value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())}
            placeholder="Add ticker symbol (e.g. AAPL, NVDA)"
            style={{
              width: '100%', padding: '14px 16px', fontSize: '15px',
              border: '2px solid #e2e8f0', borderRadius: '10px', background: 'white',
              color: '#1e293b', outline: 'none',
            }}
          />
          {error && <div style={{ marginTop: '8px', color: '#dc2626', fontSize: '14px' }}>{error}</div>}
        </div>
        <button type="submit" disabled={adding} style={{
          padding: '14px 28px', background: 'linear-gradient(135deg, #1b3f6e, #0f2444)',
          color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px',
          fontWeight: 600, cursor: 'pointer', opacity: adding ? 0.7 : 1,
        }}>
          {adding ? 'Adding…' : '+ Add'}
        </button>
      </form>

      {/* Available symbols hint */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, marginRight: '4px' }}>Available:</span>
        {KNOWN.map(s => (
          <button key={s} onClick={() => setSymbol(s)} style={{
            padding: '4px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0',
            borderRadius: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer', fontWeight: 500,
          }}>
            {s}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#94a3b8' }}>{quotes.length}/10 tracked</span>
      </div>

      {/* Quotes table */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {quotes.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📈</div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>No stocks tracked yet.</div>
            <div style={{ fontSize: '14px', marginTop: '6px' }}>Add a ticker above to start tracking.</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', padding: '14px 24px', background: '#f8fafc', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>
              <span>Symbol</span><span>Price</span><span>Change</span><span>% Change</span><span></span>
            </div>
            {quotes.map((q, i) => (
              <div key={q.symbol} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                padding: '18px 24px', alignItems: 'center',
                borderBottom: i < quotes.length - 1 ? '1px solid #f8fafc' : 'none',
                background: i % 2 === 0 ? 'white' : '#fafbfc',
              }}>
                <div>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{q.symbol}</span>
                  {q.cached && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#94a3b8', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>cached</span>}
                </div>
                <div style={{ fontSize: '17px', fontWeight: 600, color: '#1e293b', fontFamily: 'monospace' }}>
                  ${q.price.toFixed(2)}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: q.change >= 0 ? '#16a34a' : '#dc2626', fontFamily: 'monospace' }}>
                  {q.change >= 0 ? '+' : ''}{q.change.toFixed(2)}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: q.change >= 0 ? '#16a34a' : '#dc2626' }}>
                  {q.change >= 0 ? '▲' : '▼'} {Math.abs(q.percent_change).toFixed(2)}%
                </div>
                <button onClick={() => remove(q.symbol)} style={{
                  background: '#fee2e2', color: '#dc2626', border: 'none',
                  borderRadius: '8px', padding: '8px 12px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600,
                }}>
                  Remove
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
