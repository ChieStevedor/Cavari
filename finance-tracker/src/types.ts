export type AccountId = 'uber' | 'uberVault' | 'creditCard' | 'koho' | 'wise' | 'cibc';

export type ExpenseCategory =
  | 'Gas'
  | 'Цигарки'
  | 'Автокредит'
  | 'Наомі'
  | 'Їжа'
  | 'Підписки'
  | 'Експедиція'
  | "Здоров'я"
  | 'Інше';

export type Category = ExpenseCategory | 'Uber Eats income';

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
  /**
   * Set for income entries created under the Uber payout-split workflow:
   * amount is grossed up 5%, 25% of that goes to Uber Vault, the rest to
   * Uber daily. Older income entries lack these and are applied 100% to
   * `account` instead.
   */
  dailyAmount?: number;
  vaultAmount?: number;
}

export interface Settings {
  /** Monthly income target in dollars, keyed by "YYYY-MM", set independently per month. */
  incomePlanByMonth: Record<string, number>;
}
