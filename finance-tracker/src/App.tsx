import { useEffect, useState } from 'react';
import BalanceCard from './components/BalanceCard';
import AccountsSection from './components/AccountsSection';
import DebtsSection from './components/DebtsSection';
import EntryForm from './components/EntryForm';
import MonthlyOverview from './components/MonthlyOverview';
import TransactionHistory from './components/TransactionHistory';
import {
  loadAccounts,
  loadDebts,
  loadSettings,
  loadTransactions,
  saveAccounts,
  saveDebts,
  saveSettings,
  saveTransactions,
} from './storage';
import { round2 } from './format';
import { vancouverYearMonth } from './time';
import type { Accounts, AccountId, Debt, Settings, Transaction } from './types';

function App() {
  const [accounts, setAccounts] = useState<Accounts>(() => loadAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [debts, setDebts] = useState<Debt[]>(() => loadDebts());

  useEffect(() => {
    saveAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveDebts(debts);
  }, [debts]);

  function handleAddDebt(name: string, amount: number) {
    setDebts((prev) => [...prev, { id: crypto.randomUUID(), name, amount }]);
  }

  function handleUpdateDebtAmount(id: string, amount: number) {
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, amount } : d)));
  }

  function handleDeleteDebt(id: string) {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  }

  function handleUpdateAccount(id: AccountId, patch: Partial<Accounts[AccountId]>) {
    setAccounts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }

  function applyBalanceDelta(accountId: AccountId, delta: number) {
    // Credit card balance is debt owed, not an asset: money flowing "in" to
    // it (spending on the card) increases what's owed, and money flowing
    // "out" (a payment toward it) decreases what's owed - the opposite of
    // every other account.
    const signedDelta = accountId === 'creditCard' ? -delta : delta;
    setAccounts((prev) => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        balance: round2((prev[accountId].balance ?? 0) + signedDelta),
      },
    }));
  }

  // A debt is always a liability like the credit card: money flowing "in"
  // (borrowing) increases what's owed, money flowing "out" (repaying)
  // decreases it - so the delta is always inverted, unlike applyBalanceDelta
  // where only the credit card gets that treatment.
  function applyDebtDelta(debtId: string, delta: number) {
    setDebts((prev) =>
      prev.map((d) => (d.id === debtId ? { ...d, amount: round2(d.amount - delta) } : d)),
    );
  }

  // sign: 1 to apply a transaction's effect on account balances, -1 to revert it.
  function applyTransactionEffect(transaction: Transaction, sign: 1 | -1) {
    if (transaction.type === 'income') {
      if (transaction.dailyAmount !== undefined && transaction.vaultAmount !== undefined) {
        applyBalanceDelta('uber', sign * transaction.dailyAmount);
        applyBalanceDelta('uberVault', sign * transaction.vaultAmount);
      } else {
        // Legacy income entries (pre payout-split workflow): 100% to account.
        applyBalanceDelta(transaction.account ?? 'uber', sign * transaction.amount);
      }
    } else if (transaction.type === 'expense') {
      applyBalanceDelta(transaction.account!, -sign * transaction.amount);
    } else {
      if (transaction.fromAccount) {
        applyBalanceDelta(transaction.fromAccount, -sign * transaction.amount);
      } else {
        applyDebtDelta(transaction.fromDebtId!, -sign * transaction.amount);
      }
      if (transaction.toAccount) {
        applyBalanceDelta(transaction.toAccount, sign * transaction.amount);
      } else {
        applyDebtDelta(transaction.toDebtId!, sign * transaction.amount);
      }
    }
  }

  function handleAddTransaction(entry: Omit<Transaction, 'id' | 'createdAt'>) {
    const transaction: Transaction = { ...entry, id: crypto.randomUUID(), createdAt: Date.now() };
    setTransactions((prev) => [...prev, transaction]);
    applyTransactionEffect(transaction, 1);
  }

  function handleDeleteTransaction(id: string) {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) return;

    setTransactions((prev) => prev.filter((t) => t.id !== id));
    applyTransactionEffect(transaction, -1);
  }

  const debtsTotal = round2(debts.reduce((sum, d) => round2(sum + d.amount), 0));
  const totalBalance = round2(
    (accounts.uber.balance ?? 0) +
      (accounts.uberVault.balance ?? 0) +
      (accounts.koho.balance ?? 0) +
      (accounts.wise.balance ?? 0) +
      (accounts.cibc.balance ?? 0) +
      (accounts.cash.balance ?? 0) -
      (accounts.creditCard.balance ?? 0) -
      debtsTotal,
  );

  const currentYearMonth = vancouverYearMonth();
  const monthIncome = round2(
    transactions
      .filter((t) => t.type === 'income' && t.date.slice(0, 7) === currentYearMonth)
      .reduce((sum, t) => round2(sum + t.amount), 0),
  );
  const monthExpense = round2(
    transactions
      .filter((t) => t.type === 'expense' && t.date.slice(0, 7) === currentYearMonth)
      .reduce((sum, t) => round2(sum + t.amount), 0),
  );

  return (
    <div className="min-h-screen bg-[#F5F2EC]">
      <div className="mx-auto flex max-w-[480px] flex-col gap-5 px-4 py-6">
        <BalanceCard balance={totalBalance} monthIncome={monthIncome} monthExpense={monthExpense} />
        <AccountsSection accounts={accounts} onUpdateAccount={handleUpdateAccount} />
        <DebtsSection
          debts={debts}
          onAdd={handleAddDebt}
          onUpdateAmount={handleUpdateDebtAmount}
          onDelete={handleDeleteDebt}
        />
        <EntryForm accounts={accounts} debts={debts} onAddTransaction={handleAddTransaction} />
        <MonthlyOverview
          transactions={transactions}
          incomePlanByMonth={settings.incomePlanByMonth}
          onUpdateIncomePlan={(yearMonth, value) =>
            setSettings((prev) => ({
              ...prev,
              incomePlanByMonth: { ...prev.incomePlanByMonth, [yearMonth]: value },
            }))
          }
        />
        <TransactionHistory
          transactions={transactions}
          accounts={accounts}
          debts={debts}
          onDelete={handleDeleteTransaction}
        />
      </div>
    </div>
  );
}

export default App;
