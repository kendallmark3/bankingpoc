import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { Account, Transaction } from '../types';

function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function txLabel(type: Transaction['transaction_type']): string {
  return type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function txIcon(type: Transaction['transaction_type']): string {
  switch (type) {
    case 'deposit': return '↓';
    case 'withdrawal': return '↑';
    case 'transfer_in': return '↙';
    case 'transfer_out': return '↗';
  }
}

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      client.get(`/api/accounts/${id}`),
      client.get(`/api/transactions/account/${id}`),
    ])
      .then(([accRes, txRes]) => {
        setAccount(accRes.data);
        setTransactions(txRes.data);
      })
      .catch(() => setError('Failed to load account details.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="page-container">
        <div className="alert alert-error">{error || 'Account not found.'}</div>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>← Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link to="/" className="back-link">← Dashboard</Link>
          <h1 className="page-title">
            {account.account_type === 'checking' ? '💳' : '🏦'}{' '}
            {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account
          </h1>
          <p className="page-subtitle">Account #{account.account_number}</p>
        </div>
        <div className="total-balance-badge">
          <span className="balance-label">Current Balance</span>
          <span className="balance-amount">{formatCurrency(account.balance)}</span>
        </div>
      </div>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Transaction History</h2>
          <span className="badge">{transactions.length} transactions</span>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No transactions yet for this account.</p>
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
    </div>
  );
}
