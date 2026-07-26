import type { Accounts, ExpenseCategory } from './types';

export const DEFAULT_ACCOUNTS: Accounts = {
  uber: {
    id: 'uber',
    label: 'Uber (daily)',
    subtitle: 'Primary spending',
    color: '#4F8F6B',
    balance: 0,
  },
  uberVault: {
    id: 'uberVault',
    label: 'Uber Vault',
    subtitle: '25% set-aside, pending transfer to Koho',
    color: '#6E8AA3',
    balance: 0,
  },
  creditCard: {
    id: 'creditCard',
    label: 'Credit card',
    subtitle: '',
    color: '#C97B4A',
    balance: 0,
    limit: 0,
  },
  koho: {
    id: 'koho',
    label: 'Koho reserve',
    subtitle: 'Goal: 6 months of expenses',
    color: '#9B7BA3',
    balance: 0,
    goal: 0,
  },
};

export const EXPENSE_CATEGORIES: { name: ExpenseCategory; color: string }[] = [
  { name: 'Fuel', color: '#C97B4A' },
  { name: 'Food', color: '#8A9B6E' },
  { name: 'Van & Camp', color: '#6E8AA3' },
  { name: 'BJJ', color: '#A35D6E' },
  { name: 'Cavari', color: '#9B7BA3' },
  { name: 'Other', color: '#8A8478' },
];

export const CATEGORY_COLORS: Record<string, string> = {
  ...Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.name, c.color])),
  'Uber income': '#7FBF8F',
};

export const PAY_FROM_ACCOUNTS: Array<'uber' | 'uberVault' | 'creditCard' | 'koho'> = [
  'uber',
  'uberVault',
  'creditCard',
  'koho',
];
