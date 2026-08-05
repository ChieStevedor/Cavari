import type { Accounts, AccountId } from '../types';
import { currencySymbol } from '../format';
import NumberField from './NumberField';

interface AccountsSectionProps {
  accounts: Accounts;
  onUpdateAccount: (id: AccountId, patch: Partial<Accounts[AccountId]>) => void;
}

interface Brand {
  background: string;
  content: React.ReactNode;
}

const PRIVAT_BRAND: Brand = {
  background: '#5CAA3C',
  content: <span className="text-base font-black tracking-tight text-white">Приват</span>,
};

const ITALIA_BRAND: Brand = {
  // Vertical bands of the Italian flag.
  background:
    'linear-gradient(90deg, #009246 0%, #009246 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #CE2B37 66.66%, #CE2B37 100%)',
  content: <span className="text-base font-black tracking-tight text-[#1B1B1B]">Italia</span>,
};

function PillowIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 9c0-2.76 2.24-4 6-4h4c3.76 0 6 1.24 6 4v6c0 2.76-2.24 4-6 4h-4c-3.76 0-6-1.24-6-4V9z" />
      <path d="M9.5 8c1.2 1.3 1.2 2.7 0 4M14.5 16c-1.2-1.3-1.2-2.7 0-4" />
    </svg>
  );
}

const PILLOW_BRAND: Brand = {
  background: '#8A7355',
  content: (
    <div className="text-white/90">
      <PillowIcon />
    </div>
  ),
};

function BrandCard({ brand }: { brand: Brand }) {
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
  brand,
  onUpdateAccount,
}: {
  account: Accounts[AccountId];
  brand: Brand;
  onUpdateAccount: (id: AccountId, patch: Partial<Accounts[AccountId]>) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <BrandCard brand={brand} />
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
  const { privatPension, privatEur, privatUsd, italiaBank, pillow } = accounts;

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#8A8478]">Счета</h2>
      <div className="flex flex-col gap-3">
        {/* PrivatBank: three currency balances under one card */}
        <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
          <div className="flex items-center gap-3">
            <BrandCard brand={PRIVAT_BRAND} />
            <div className="flex flex-1 flex-col gap-1.5">
              <NumberField
                label="UAH"
                value={privatPension.balance}
                onChange={(v) => onUpdateAccount('privatPension', { balance: v })}
                color={privatPension.color}
                symbol={currencySymbol(privatPension.currency)}
              />
              <NumberField
                label="EUR"
                value={privatEur.balance}
                onChange={(v) => onUpdateAccount('privatEur', { balance: v })}
                color={privatEur.color}
                symbol={currencySymbol(privatEur.currency)}
              />
              <NumberField
                label="USD"
                value={privatUsd.balance}
                onChange={(v) => onUpdateAccount('privatUsd', { balance: v })}
                color={privatUsd.color}
                symbol={currencySymbol(privatUsd.currency)}
              />
            </div>
          </div>
        </div>

        <SimpleAccountCard account={italiaBank} brand={ITALIA_BRAND} onUpdateAccount={onUpdateAccount} />
        <SimpleAccountCard account={pillow} brand={PILLOW_BRAND} onUpdateAccount={onUpdateAccount} />
      </div>
    </div>
  );
}
