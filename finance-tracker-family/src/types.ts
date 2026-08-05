export type AccountId = 'privatPension' | 'privatEur' | 'privatUsd' | 'italiaBank' | 'pillow';

export type Currency = 'UAH' | 'EUR' | 'USD';

export type ExpenseCategory = 'Еда' | 'Транспорт' | 'Здоровье' | 'Разное';

export type Category = ExpenseCategory | 'Доход';

export interface Account {
  id: AccountId;
  label: string;
  currency: Currency;
  color: string;
  /** null = not yet set by the user; shows blank instead of 0. */
  balance: number | null;
}

export type Accounts = Record<AccountId, Account>;

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  note: string;
  createdAt: number;
  /** Set for income/expense entries only. */
  category?: Category;
  /** Set for income/expense entries only. */
  account?: AccountId;
  /** Set for transfer entries only. */
  fromAccount?: AccountId;
  /** Set for transfer entries only. */
  toAccount?: AccountId;
}

export interface ExchangeRates {
  /** How many UAH per 1 EUR. */
  uahPerEur: number | null;
  /** How many USD per 1 EUR. */
  usdPerEur: number | null;
}

export interface Settings {
  /** Monthly income target in EUR-equivalent, keyed by "YYYY-MM". */
  incomePlanByMonth: Record<string, number>;
  exchangeRates: ExchangeRates;
}
