import { DEFAULT_ACCOUNTS, DEFAULT_SETTINGS } from './data';
import type { Account, Accounts, Settings, Transaction } from './types';

const TRANSACTIONS_KEY = 'family-finance-transactions';
const ACCOUNTS_KEY = 'family-finance-accounts';
const SETTINGS_KEY = 'family-finance-settings';

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

// A stored 0 predates the null-means-unset convention and is numerically
// identical to unset everywhere it's used (always read via `?? 0`), so
// treating it as unset here is a purely cosmetic, safe reinterpretation.
function normalizeAccount(account: Account): Account {
  return { ...account, balance: account.balance === 0 ? null : account.balance };
}

export function loadAccounts(): Accounts {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return DEFAULT_ACCOUNTS;
    const parsed = JSON.parse(raw) as Accounts;
    const merged = { ...DEFAULT_ACCOUNTS, ...parsed };
    return Object.fromEntries(
      Object.entries(merged).map(([id, account]) => [id, normalizeAccount(account)]),
    ) as Accounts;
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
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const incomePlanByMonth = Object.fromEntries(
      Object.entries({
        ...DEFAULT_SETTINGS.incomePlanByMonth,
        ...(parsed.incomePlanByMonth ?? {}),
      }).filter(([, value]) => value !== 0),
    );
    return {
      incomePlanByMonth,
      exchangeRates: { ...DEFAULT_SETTINGS.exchangeRates, ...(parsed.exchangeRates ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
