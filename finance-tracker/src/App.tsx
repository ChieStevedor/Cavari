import { useEffect, useState } from 'react';
import BalanceCard from './components/BalanceCard';
import AccountsSection from './components/AccountsSection';
import EntryForm from './components/EntryForm';
import CategoryBreakdown from './components/CategoryBreakdown';
import TransactionHistory from './components/TransactionHistory';
import { loadAccounts, loadTransactions, saveAccounts, saveTransactions } from './storage';
import type { Accounts, AccountId, Transaction } from './types';

function App() {
  const [accounts, setAccounts] = useState<Accounts>(() => loadAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());

  useEffect(() => {
    saveAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  function handleUpdateAccount(id: AccountId, patch: Partial<Accounts[AccountId]>) {
    setAccounts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }

  function applyBalanceDelta(accountId: AccountId, delta: number) {
    setAccounts((prev) => ({
      ...prev,
      [accountId]: { ...prev[accountId], balance: prev[accountId].balance + delta },
    }));
  }

  function handleAddTransaction(entry: Omit<Transaction, 'id' | 'createdAt'>) {
    const transaction: Transaction = { ...entry, id: crypto.randomUUID(), createdAt: Date.now() };
    setTransactions((prev) => [...prev, transaction]);

    const delta = transaction.type === 'income' ? transaction.amount : -transaction.amount;
    applyBalanceDelta(transaction.account, delta);
  }

  function handleDeleteTransaction(id: string) {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) return;

    setTransactions((prev) => prev.filter((t) => t.id !== id));

    const delta = transaction.type === 'income' ? -transaction.amount : transaction.amount;
    applyBalanceDelta(transaction.account, delta);
  }

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#F5F2EC]">
      <div className="mx-auto flex max-w-[480px] flex-col gap-5 px-4 py-6">
        <BalanceCard totalIncome={totalIncome} totalExpense={totalExpense} />
        <AccountsSection accounts={accounts} onUpdateAccount={handleUpdateAccount} />
        <EntryForm accounts={accounts} onAddTransaction={handleAddTransaction} />
        <CategoryBreakdown transactions={transactions} />
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
