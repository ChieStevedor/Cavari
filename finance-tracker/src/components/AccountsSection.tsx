import { CreditCard, Globe, Landmark, PiggyBank, Shield, Truck } from 'lucide-react';
import type { Accounts, AccountId } from '../types';
import { formatCurrency, round2 } from '../format';
import NumberField from './NumberField';

interface AccountsSectionProps {
  accounts: Accounts;
  onUpdateAccount: (id: AccountId, patch: Partial<Accounts[AccountId]>) => void;
}

function SimpleAccountCard({
  account,
  icon,
  onUpdateAccount,
}: {
  account: Accounts[AccountId];
  icon: React.ReactNode;
  onUpdateAccount: (id: AccountId, patch: Partial<Accounts[AccountId]>) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
      <div className="flex items-center gap-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: `${account.color}22`, color: account.color }}
        >
          {icon}
        </div>
        <div>
          <div className="font-medium">{account.label}</div>
          {account.subtitle && <div className="text-xs text-[#8A8478]">{account.subtitle}</div>}
        </div>
      </div>
      <div className="mt-3">
        <NumberField
          label="Balance"
          value={account.balance}
          onChange={(v) => onUpdateAccount(account.id, { balance: v })}
          color={account.color}
        />
      </div>
    </div>
  );
}

export default function AccountsSection({ accounts, onUpdateAccount }: AccountsSectionProps) {
  const { uber, uberVault, creditCard, koho, wise, cibc } = accounts;
  const utilization = creditCard.limit
    ? round2((creditCard.balance / creditCard.limit) * 100)
    : 0;
  const overTarget = utilization > 35;
  const koioProgress = koho.goal ? Math.min(100, round2((koho.balance / koho.goal) * 100)) : 0;

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#8A8478]">
        Accounts
      </h2>
      <div className="flex flex-col gap-3">
        <SimpleAccountCard
          account={uber}
          icon={<Truck size={18} />}
          onUpdateAccount={onUpdateAccount}
        />
        <SimpleAccountCard
          account={uberVault}
          icon={<PiggyBank size={18} />}
          onUpdateAccount={onUpdateAccount}
        />

        {/* Credit card */}
        <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: `${creditCard.color}22`, color: creditCard.color }}
            >
              <CreditCard size={18} />
            </div>
            <div className="font-medium">{creditCard.label}</div>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <NumberField
              label="Balance"
              value={creditCard.balance}
              onChange={(v) => onUpdateAccount('creditCard', { balance: v })}
              color={creditCard.color}
            />
            <NumberField
              label="Limit"
              value={creditCard.limit ?? 0}
              onChange={(v) => onUpdateAccount('creditCard', { limit: v })}
              color={creditCard.color}
            />
          </div>

          <div className="mt-3">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#F0ECE3]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, utilization))}%`,
                  backgroundColor: overTarget ? '#C9694A' : creditCard.color,
                }}
              />
              <div
                className="absolute top-0 h-full w-px bg-[#2B2620]/40"
                style={{ left: '35%' }}
              />
            </div>
            <div
              className={`mt-1 text-xs ${overTarget ? 'font-bold' : ''}`}
              style={{ color: overTarget ? '#C9694A' : '#8A8478' }}
            >
              {utilization.toFixed(0)}% utilization
              {overTarget ? ' — above 35% target' : ''}
            </div>
          </div>
        </div>

        {/* Koho reserve */}
        <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: `${koho.color}22`, color: koho.color }}
            >
              <Shield size={18} />
            </div>
            <div>
              <div className="font-medium">{koho.label}</div>
              <div className="text-xs text-[#8A8478]">{koho.subtitle}</div>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <NumberField
              label="Balance"
              value={koho.balance}
              onChange={(v) => onUpdateAccount('koho', { balance: v })}
              color={koho.color}
            />
            <NumberField
              label="Goal"
              value={koho.goal ?? 0}
              onChange={(v) => onUpdateAccount('koho', { goal: v })}
              color={koho.color}
            />
          </div>
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0ECE3]">
              <div
                className="h-full rounded-full"
                style={{ width: `${koioProgress}%`, backgroundColor: koho.color }}
              />
            </div>
            <div className="mt-1 text-xs text-[#8A8478]">
              {formatCurrency(koho.balance)} of {formatCurrency(koho.goal ?? 0)} (
              {koioProgress.toFixed(0)}%)
            </div>
          </div>
        </div>

        <SimpleAccountCard
          account={wise}
          icon={<Globe size={18} />}
          onUpdateAccount={onUpdateAccount}
        />
        <SimpleAccountCard
          account={cibc}
          icon={<Landmark size={18} />}
          onUpdateAccount={onUpdateAccount}
        />
      </div>
    </div>
  );
}
