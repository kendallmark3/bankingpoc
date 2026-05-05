export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  account_type: 'checking' | 'savings';
  balance: number;
  account_number: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  related_account_id: string | null;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out';
  amount: number;
  description: string | null;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}
