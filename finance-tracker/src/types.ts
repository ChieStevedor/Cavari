export type AccountId = 'uber' | 'uberVault' | 'creditCard' | 'koho' | 'wise' | 'cibc' | 'cash';

export type ExpenseCategory =
  | 'Gas'
  | 'Цигарки'
  | 'Автокредит'
  | 'Наомі'
  | 'Їжа'
  | 'Підписки'
  | 'Parking'
  | 'Інше';

export type Category = ExpenseCategory | 'Uber Eats income';

export interface Account {
  id: AccountId;
  label: string;
  subtitle: string;
  color: string;
  /** null = not yet set by the user; shows blank instead of 0. */
  balance: number | null;
  limit?: number | null;
  goal?: number | null;
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
  /** Set for transfer entries only; mutually exclusive with fromDebtId. */
  fromAccount?: AccountId;
  /** Set for transfer entries only; mutually exclusive with toDebtId. */
  toAccount?: AccountId;
  /** Set for transfer entries that borrow from a debt; mutually exclusive with fromAccount. */
  fromDebtId?: string;
  /** Set for transfer entries that repay a debt; mutually exclusive with toAccount. */
  toDebtId?: string;
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

export interface Debt {
  id: string;
  name: string;
  /** Amount currently owed to this person. Subtracted from Total balance. */
  amount: number;
}
