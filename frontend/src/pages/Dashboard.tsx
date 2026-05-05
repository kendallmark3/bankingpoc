import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Account, Transaction } from '../types';

type ModalType = 'deposit' | 'withdraw' | null;

interface QuickActionState {
  accountId: string;
  type: ModalType;
  amount: string;
  description: string;
}

function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function txIcon(type: Transaction['transaction_type']): string {
  switch (type) {
    case 'deposit': return '↓';
    case 'withdrawal': return '↑';
    case 'transfer_in': return '↙';
    case 'transfer_out': return '↗';
  }
}

function txLabel(type: Transaction['transaction_type']): string {
  return type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function Dashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [modal, setModal] = useState<QuickActionState | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [newAccountType, setNewAccountType] = useState<'checking' | 'savings'>('savings');

  const loadData = async () => {
    try {
      const [accRes, txRes] = await Promise.all([
        client.get('/api/accounts'),
        client.get('/api/transactions'),
      ]);
      setAccounts(accRes.data);
      setTransactions(txRes.data.slice(0, 5));
    } finally {
      setLoadingAccounts(false);
      setLoadingTx(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openModal = (accountId: string, type: ModalType) => {
    setActionError('');
    setActionSuccess('');
    setModal({ accountId, type, amount: '', description: '' });
  };

  const closeModal = () => setModal(null);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setActionLoading(true);
    setActionError('');
    try {
      const endpoint = modal.type === 'deposit'
        ? `/api/accounts/${modal.accountId}/deposit`
        : `/api/accounts/${modal.accountId}/withdraw`;
      await client.post(endpoint, {
        amount: parseFloat(modal.amount),
        description: modal.description || undefined,
      });
      setActionSuccess(`${modal.type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`);
      closeModal();
      loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAccount(true);
    try {
      await client.post('/api/accounts', { account_type: newAccountType });
      loadData();
    } catch {
      // silently fail
    } finally {
      setCreatingAccount(false);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="page-subtitle">Here's your financial overview</p>
        </div>
        <div className="total-balance-badge">
          <span className="balance-label">Total Balance</span>
          <span className="balance-amount">{formatCurrency(totalBalance)}</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{actionSuccess}</div>
      )}

      {/* Accounts Section */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Your Accounts</h2>
        </div>

        {loadingAccounts ? (
          <div className="loading-row"><div className="spinner" /></div>
        ) : (
          <div className="accounts-grid">
            {accounts.map((account) => (
              <div key={account.id} className={`account-card account-card--${account.account_type}`}>
                <div className="account-card-header">
                  <div>
                    <span className="account-type-badge">
                      {account.account_type === 'checking' ? '💳' : '🏦'}{' '}
                      {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}
                    </span>
                    <div className="account-number">•••• {account.account_number.slice(-4)}</div>
                  </div>
                  <Link to={`/accounts/${account.id}`} className="btn btn-ghost btn-sm">
                    View →
                  </Link>
                </div>
                <div className="account-balance">{formatCurrency(account.balance)}</div>
                <div className="account-actions">
                  <button className="btn btn-success btn-sm" onClick={() => openModal(account.id, 'deposit')}>
                    + Deposit
                  </button>
                  <button className="btn btn-warning btn-sm" onClick={() => openModal(account.id, 'withdraw')}>
                    − Withdraw
                  </button>
                  <Link to="/transfer" className="btn btn-secondary btn-sm">
                    ⇄ Transfer
                  </Link>
                </div>
              </div>
            ))}

            {/* Add Account Card */}
            <div className="account-card account-card--new">
              <h3 className="new-account-title">Open New Account</h3>
              <form onSubmit={handleCreateAccount} className="new-account-form">
                <select
                  className="form-input"
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value as any)}
                >
                  <option value="checking">Checking Account</option>
                  <option value="savings">Savings Account</option>
                </select>
                <button type="submit" className="btn btn-primary btn-sm" disabled={creatingAccount}>
                  {creatingAccount ? <span className="btn-spinner" /> : 'Open Account'}
                </button>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Recent Transactions */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Recent Transactions</h2>
        </div>

        {loadingTx ? (
          <div className="loading-row"><div className="spinner" /></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No transactions yet. Make a deposit to get started!</p>
          </div>
        ) : (
          <div className="transactions-table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <span className={`tx-badge tx-badge--${tx.transaction_type}`}>
                        {txIcon(tx.transaction_type)} {txLabel(tx.transaction_type)}
                      </span>
                    </td>
                    <td className="tx-description">{tx.description || '—'}</td>
                    <td className="tx-date">{formatDate(tx.created_at)}</td>
                    <td className={`tx-amount text-right ${tx.transaction_type === 'deposit' || tx.transaction_type === 'transfer_in' ? 'amount-positive' : 'amount-negative'}`}>
                      {tx.transaction_type === 'deposit' || tx.transaction_type === 'transfer_in' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quick Action Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {modal.type === 'deposit' ? '💰 Deposit Funds' : '💸 Withdraw Funds'}
              </h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            {actionError && <div className="alert alert-error">{actionError}</div>}

            <form onSubmit={handleAction} className="modal-form">
              <div className="form-group">
                <label className="form-label">Amount (USD)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  value={modal.amount}
                  onChange={(e) => setModal({ ...modal, amount: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Paycheck, Rent..."
                  value={modal.description}
                  onChange={(e) => setModal({ ...modal, description: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button
                  type="submit"
                  className={`btn ${modal.type === 'deposit' ? 'btn-success' : 'btn-warning'}`}
                  disabled={actionLoading}
                >
                  {actionLoading ? <span className="btn-spinner" /> : modal.type === 'deposit' ? 'Deposit' : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
