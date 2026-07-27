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
  { name: 'Gas', color: '#C97B4A' },
  { name: 'Цигарки', color: '#8A6E5A' },
  { name: 'Автокредит', color: '#6E8AA3' },
  { name: 'Наомі', color: '#A35D6E' },
  { name: 'Їжа', color: '#8A9B6E' },
  { name: 'Підписки', color: '#9B7BA3' },
  { name: 'Експедиція', color: '#4A9B94' },
  { name: 'Інше', color: '#8A8478' },
];

// Colors for categories no longer in EXPENSE_CATEGORIES, kept so existing
// stored transactions still render with their original category color.
const LEGACY_CATEGORY_COLORS: Record<string, string> = {
  Fuel: '#C97B4A',
  Food: '#8A9B6E',
  'Van & Camp': '#6E8AA3',
  BJJ: '#A35D6E',
  Cavari: '#9B7BA3',
  Other: '#8A8478',
  'Uber income': '#7FBF8F',
};

export const CATEGORY_COLORS: Record<string, string> = {
  ...LEGACY_CATEGORY_COLORS,
  ...Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.name, c.color])),
  'Uber Eats income': '#4F8F6B',
};

export const PAY_FROM_ACCOUNTS: Array<'uber' | 'uberVault' | 'creditCard' | 'koho'> = [
  'uber',
  'uberVault',
  'creditCard',
  'koho',
];
