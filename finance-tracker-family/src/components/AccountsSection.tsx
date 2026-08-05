import { Home } from 'lucide-react';
import type { Accounts, AccountId } from '../types';
import { currencySymbol } from '../format';
import NumberField from './NumberField';

interface AccountsSectionProps {
  accounts: Accounts;
  onUpdateAccount: (id: AccountId, patch: Partial<Accounts[AccountId]>) => void;
}

const BRAND_CARD: Record<AccountId, { background: string; content: React.ReactNode }> = {
  privatPension: {
    background: '#5CAA3C',
    content: (
      <div className="flex flex-col items-center leading-none">
        <span className="text-base font-black tracking-tight text-white">Приват</span>
        <span className="mt-1 text-[11px] font-semibold tracking-wide text-white/85">UAH</span>
      </div>
    ),
  },
  privatEur: {
    background: '#4A8F31',
    content: (
      <div className="flex flex-col items-center leading-none">
        <span className="text-base font-black tracking-tight text-white">Приват</span>
        <span className="mt-1 text-[11px] font-semibold tracking-wide text-white/85">EUR</span>
      </div>
    ),
  },
  privatUsd: {
    background: '#3D7729',
    content: (
      <div className="flex flex-col items-center leading-none">
        <span className="text-base font-black tracking-tight text-white">Приват</span>
        <span className="mt-1 text-[11px] font-semibold tracking-wide text-white/85">USD</span>
      </div>
    ),
  },
  italiaBank: {
    background: '#1F3B5C',
    content: <span className="text-base font-black tracking-tight text-white">Italia</span>,
  },
  pillow: {
    background: '#8A7355',
    content: <Home size={22} strokeWidth={1.75} className="text-white/90" />,
  },
};

function BrandCard({ accountId }: { accountId: AccountId }) {
  const brand = BRAND_CARD[accountId];
  return (
    <div
      className="flex aspect-[1.586/1] w-28 shrink-0 items-center justify-center rounded-lg shadow-sm"
      style={{ background: brand.background }}
    >
      {brand.content}
    </div>
  );
}

function SimpleAccountCard({
  account,
  onUpdateAccount,
}: {
  account: Accounts[AccountId];
  onUpdateAccount: (id: AccountId, patch: Partial<Accounts[AccountId]>) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <BrandCard accountId={account.id} />
        <NumberField
          value={account.balance}
          onChange={(v) => onUpdateAccount(account.id, { balance: v })}
          color={account.color}
          symbol={currencySymbol(account.currency)}
        />
      </div>
    </div>
  );
}

export default function AccountsSection({ accounts, onUpdateAccount }: AccountsSectionProps) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#8A8478]">Счета</h2>
      <div className="flex flex-col gap-3">
        <SimpleAccountCard account={accounts.privatPension} onUpdateAccount={onUpdateAccount} />
        <SimpleAccountCard account={accounts.privatEur} onUpdateAccount={onUpdateAccount} />
        <SimpleAccountCard account={accounts.privatUsd} onUpdateAccount={onUpdateAccount} />
        <SimpleAccountCard account={accounts.italiaBank} onUpdateAccount={onUpdateAccount} />
        <SimpleAccountCard account={accounts.pillow} onUpdateAccount={onUpdateAccount} />
      </div>
    </div>
  );
}
