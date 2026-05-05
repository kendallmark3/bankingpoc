import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAuth = location.pathname !== '/login' && location.pathname !== '/register';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🏦</span>
          <span className="logo-text">BankingPOC</span>
        </Link>
      </div>

      {user && isAuth && (
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/transfer" className={`nav-link ${location.pathname === '/transfer' ? 'active' : ''}`}>
            Transfer
          </Link>
        </div>
      )}

      <div className="navbar-actions">
        {user ? (
          <div className="navbar-user">
            <span className="user-greeting">
              {user.first_name} {user.last_name}
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        ) : (
          <div className="navbar-auth">
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/register" className="btn btn-light btn-sm">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
