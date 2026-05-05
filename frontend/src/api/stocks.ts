import api from './client'

export const getQuotes = () => api.get('/stocks/quotes')
export const addToWatchlist = (symbol: string) => api.post('/stocks/watchlist', { symbol })
export const removeFromWatchlist = (symbol: string) => api.delete(`/stocks/watchlist/${symbol}`)
export const getTipOfDay = () => api.get('/stocks/tip-of-the-day')
