import type { Accounts, AccountId, ExpenseCategory, Settings } from './types';

export const DEFAULT_ACCOUNTS: Accounts = {
  privatPension: {
    id: 'privatPension',
    label: 'ПриватБанк · Пенсионный',
    currency: 'UAH',
    color: '#5CAA3C',
    balance: null,
  },
  privatEur: {
    id: 'privatEur',
    label: 'ПриватБанк · EUR',
    currency: 'EUR',
    color: '#4A8F31',
    balance: null,
  },
  privatUsd: {
    id: 'privatUsd',
    label: 'ПриватБанк · USD',
    currency: 'USD',
    color: '#3D7729',
    balance: null,
  },
  italiaBank: {
    id: 'italiaBank',
    label: 'Italian Bank',
    currency: 'EUR',
    color: '#1F3B5C',
    balance: null,
  },
  pillow: {
    id: 'pillow',
    label: 'Под подушкой',
    currency: 'EUR',
    color: '#8A7355',
    balance: null,
  },
};

export const EXPENSE_CATEGORIES: { name: ExpenseCategory; color: string }[] = [
  { name: 'Еда', color: '#C97B4A' },
  { name: 'Транспорт', color: '#6E8AA3' },
  { name: 'Здоровье', color: '#A35D8C' },
  { name: 'Разное', color: '#8A8478' },
];

export const CATEGORY_COLORS: Record<string, string> = {
  ...Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.name, c.color])),
  Доход: '#4F8F6B',
};

export const PAY_FROM_ACCOUNTS: AccountId[] = [
  'privatPension',
  'privatEur',
  'privatUsd',
  'italiaBank',
  'pillow',
];

export const TRANSFER_COLOR = '#8A8478';

export const DEFAULT_SETTINGS: Settings = {
  incomePlanByMonth: {},
  exchangeRates: {
    uahPerEur: null,
    usdPerEur: null,
  },
};
