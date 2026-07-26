export type AccountId = 'uber' | 'uberVault' | 'creditCard' | 'koho';

export type ExpenseCategory = 'Fuel' | 'Food' | 'Van & Camp' | 'BJJ' | 'Cavari' | 'Other';

export type Category = ExpenseCategory | 'Uber income';

export interface Account {
  id: AccountId;
  label: string;
  subtitle: string;
  color: string;
  balance: number;
  limit?: number;
  goal?: number;
}

export type Accounts = Record<AccountId, Account>;

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  category: Category;
  account: AccountId;
  note: string;
  createdAt: number;
}
