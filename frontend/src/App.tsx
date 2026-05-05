import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import ProfileCreate from './pages/ProfileCreate'
import Accounts from './pages/Accounts'
import AccountCreate from './pages/AccountCreate'
import Balances from './pages/Balances'
import Overdraft from './pages/Overdraft'
import Watchlist from './pages/Watchlist'
import StockTip from './pages/StockTip'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/create" element={<ProfileCreate />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/new" element={<AccountCreate />} />
        <Route path="/balances" element={<Balances />} />
        <Route path="/overdraft" element={<Overdraft />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/stock-tip" element={<StockTip />} />
        <Route path="/settings" element={<div className="text-slate-500 p-4">Settings coming soon.</div>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
