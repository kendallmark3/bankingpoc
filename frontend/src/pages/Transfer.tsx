import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { Account } from '../types';

function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
}

export default function Transfer() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState({
    from_account_id: '',
    to_account_number: '',
    amount: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    client.get('/api/accounts').then((res) => {
      setAccounts(res.data);
      if (res.data.length > 0) {
        setForm((f) => ({ ...f, from_account_id: res.data[0].id }));
      }
    });
  }, []);

  const selectedAccount = accounts.find((a) => a.id === form.from_account_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await client.post('/api/transactions/transfer', {
        from_account_id: form.from_account_id,
        to_account_number: form.to_account_number,
        amount: parseFloat(form.amount),
        description: form.description || undefined,
      });
      setSuccess('Transfer completed successfully!');
      setForm((f) => ({ ...f, to_account_number: '', amount: '', description: '' }));
      // Refresh accounts to show updated balance
      const res = await client.get('/api/accounts');
      setAccounts(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Transfer failed. Please check the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container page-container--narrow">
      <div className="page-header">
        <div>
          <h1 className="page-title">⇄ Transfer Funds</h1>
          <p className="page-subtitle">Send money to any account using its account number</p>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit} className="transfer-form">
          <div className="form-group">
            <label className="form-label">From Account</label>
            <select
              className="form-input"
              value={form.from_account_id}
              onChange={(e) => setForm({ ...form, from_account_id: e.target.value })}
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_type.charAt(0).toUpperCase() + a.account_type.slice(1)} — ••••{a.account_number.slice(-4)} — {formatCurrency(a.balance)}
                </option>
              ))}
            </select>
            {selectedAccount && (
              <p className="form-hint">
                Available balance: <strong>{formatCurrency(selectedAccount.balance)}</strong>
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">To Account Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="10-digit account number"
              value={form.to_account_number}
              onChange={(e) => setForm({ ...form, to_account_number: e.target.value })}
              required
              maxLength={10}
              minLength={10}
              pattern="[0-9]{10}"
              title="Must be a 10-digit account number"
            />
            <p className="form-hint">Enter the recipient's 10-digit account number.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (USD)</label>
            <input
              type="number"
              className="form-input"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Rent payment, Split dinner..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || accounts.length === 0}>
              {loading ? <span className="btn-spinner" /> : 'Send Transfer'}
            </button>
          </div>
        </form>
      </div>

      {/* Own accounts quick reference */}
      {accounts.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 className="card-title">Your Account Numbers</h3>
          <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
            Share these to receive transfers from others.
          </p>
          <div className="account-numbers-list">
            {accounts.map((a) => (
              <div key={a.id} className="account-number-row">
                <span className="account-type-label">
                  {a.account_type === 'checking' ? '💳' : '🏦'}{' '}
                  {a.account_type.charAt(0).toUpperCase() + a.account_type.slice(1)}
                </span>
                <code className="account-number-code">{a.account_number}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
