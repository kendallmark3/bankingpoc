import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import * as authApi from '../api/auth'

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'))

  const login = async (email: string, password: string) => {
    await authApi.login(email, password)
    setIsAuthenticated(true)
  }

  const logout = async () => {
    await authApi.logout()
    setIsAuthenticated(false)
  }

  return <AuthContext.Provider value={{ isAuthenticated, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
