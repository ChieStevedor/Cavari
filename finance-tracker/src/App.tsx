import { useEffect, useState } from 'react';
import BalanceCard from './components/BalanceCard';
import AccountsSection from './components/AccountsSection';
import EntryForm from './components/EntryForm';
import MonthlyOverview from './components/MonthlyOverview';
import TransactionHistory from './components/TransactionHistory';
import {
  loadAccounts,
  loadSettings,
  loadTransactions,
  saveAccounts,
  saveSettings,
  saveTransactions,
} from './storage';
import { round2 } from './format';
import { vancouverYearMonth } from './time';
import type { Accounts, AccountId, Settings, Transaction } from './types';

function App() {
  const [accounts, setAccounts] = useState<Accounts>(() => loadAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  useEffect(() => {
    saveAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  function handleUpdateAccount(id: AccountId, patch: Partial<Accounts[AccountId]>) {
    setAccounts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }

  function applyBalanceDelta(accountId: AccountId, delta: number) {
    setAccounts((prev) => ({
      ...prev,
      [accountId]: { ...prev[accountId], balance: round2(prev[accountId].balance + delta) },
    }));
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
      applyBalanceDelta(transaction.fromAccount!, -sign * transaction.amount);
      applyBalanceDelta(transaction.toAccount!, sign * transaction.amount);
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

  const totalBalance = round2(
    accounts.uber.balance +
      accounts.uberVault.balance +
      accounts.koho.balance +
      accounts.wise.balance +
      accounts.cibc.balance -
      accounts.creditCard.balance,
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
        <EntryForm accounts={accounts} onAddTransaction={handleAddTransaction} />
        <MonthlyOverview
          transactions={transactions}
          incomePlan={settings.incomePlan}
          onUpdateIncomePlan={(incomePlan) => setSettings((prev) => ({ ...prev, incomePlan }))}
        />
        <TransactionHistory
          transactions={transactions}
          accounts={accounts}
          onDelete={handleDeleteTransaction}
        />
      </div>
    </div>
  );
}

export default App;
