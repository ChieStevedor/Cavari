import { DEFAULT_ACCOUNTS, DEFAULT_SETTINGS } from './data';
import type { Accounts, Settings, Transaction } from './types';

const TRANSACTIONS_KEY = 'cavari-finance-transactions';
const ACCOUNTS_KEY = 'cavari-finance-accounts';
const SETTINGS_KEY = 'cavari-finance-settings';

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Transaction[];
    return parsed.map((t) => ({ ...t, createdAt: t.createdAt ?? 0 }));
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

export function loadAccounts(): Accounts {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return DEFAULT_ACCOUNTS;
    const parsed = JSON.parse(raw) as Accounts;
    return { ...DEFAULT_ACCOUNTS, ...parsed };
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export function saveAccounts(accounts: Accounts): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Settings) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
