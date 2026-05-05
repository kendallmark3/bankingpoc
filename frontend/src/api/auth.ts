import api from './client'

export const register = (email: string, password: string) =>
  api.post('/auth/register', { email, password })

export const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password })
  const tokens = data.data
  localStorage.setItem('access_token', tokens.access_token)
  localStorage.setItem('refresh_token', tokens.refresh_token)
  return tokens
}

export const logout = async () => {
  const refreshToken = localStorage.getItem('refresh_token')
  if (refreshToken) await api.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {})
  localStorage.clear()
}
