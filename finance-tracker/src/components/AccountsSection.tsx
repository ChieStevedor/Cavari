import { CreditCard, Globe, Landmark, PiggyBank, Shield, Truck } from 'lucide-react';
import type { Accounts, AccountId } from '../types';
import { formatCurrency, round2 } from '../format';
import NumberField from './NumberField';

interface AccountsSectionProps {
  accounts: Accounts;
  onUpdateAccount: (id: AccountId, patch: Partial<Accounts[AccountId]>) => void;
}

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r}, ${g}, ${b})`;
}

// Real bank/service logos aren't practical to source reliably here, so
// accounts get a mini "card" look instead: a gradient banner in the
// account's own color with card-style chip and embossed-style name.
function CardBanner({
  label,
  subtitle,
  color,
  icon,
}: {
  label: string;
  subtitle?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl px-3.5 py-3 text-white shadow-sm"
      style={{ background: `linear-gradient(135deg, ${color}, ${darken(color, 45)})` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/25">
          {icon}
        </div>
        <div className="h-3.5 w-5 rounded-sm bg-white/20" />
      </div>
      <div className="mt-3 text-sm font-semibold tracking-wide">{label}</div>
      {subtitle && <div className="text-[10.5px] text-white/75">{subtitle}</div>}
    </div>
  );
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
    <div className="rounded-2xl border border-[#E8E3D9] bg-white p-3">
      <CardBanner
        label={account.label}
        subtitle={account.subtitle}
        color={account.color}
        icon={icon}
      />
      <div className="mt-3 px-1 pb-1">
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
  const creditCardBalance = creditCard.balance ?? 0;
  const creditCardLimit = creditCard.limit ?? 0;
  const utilization = creditCardLimit ? round2((creditCardBalance / creditCardLimit) * 100) : 0;
  const overTarget = utilization > 35;

  const kohoBalance = koho.balance ?? 0;
  const kohoGoal = koho.goal ?? 0;
  const koioProgress = kohoGoal ? Math.min(100, round2((kohoBalance / kohoGoal) * 100)) : 0;

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#8A8478]">
        Accounts
      </h2>
      <div className="flex flex-col gap-3">
        <SimpleAccountCard
          account={uber}
          icon={<Truck size={14} />}
          onUpdateAccount={onUpdateAccount}
        />
        <SimpleAccountCard
          account={uberVault}
          icon={<PiggyBank size={14} />}
          onUpdateAccount={onUpdateAccount}
        />

        {/* Koho reserve */}
        <div className="rounded-2xl border border-[#E8E3D9] bg-white p-3">
          <CardBanner
            label={koho.label}
            subtitle={koho.subtitle}
            color={koho.color}
            icon={<Shield size={14} />}
          />
          <div className="mt-3 flex flex-col gap-2 px-1">
            <NumberField
              label="Balance"
              value={koho.balance}
              onChange={(v) => onUpdateAccount('koho', { balance: v })}
              color={koho.color}
            />
            <NumberField
              label="Goal"
              value={koho.goal}
              onChange={(v) => onUpdateAccount('koho', { goal: v })}
              color={koho.color}
            />
          </div>
          <div className="mt-3 px-1 pb-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0ECE3]">
              <div
                className="h-full rounded-full"
                style={{ width: `${koioProgress}%`, backgroundColor: koho.color }}
              />
            </div>
            <div className="mt-1 text-xs text-[#8A8478]">
              {formatCurrency(kohoBalance)} of {formatCurrency(kohoGoal)} (
              {koioProgress.toFixed(0)}%)
            </div>
          </div>
        </div>

        <SimpleAccountCard
          account={cibc}
          icon={<Landmark size={14} />}
          onUpdateAccount={onUpdateAccount}
        />

        {/* Credit card */}
        <div className="rounded-2xl border border-[#E8E3D9] bg-white p-3">
          <CardBanner
            label={creditCard.label}
            subtitle={creditCard.subtitle}
            color={creditCard.color}
            icon={<CreditCard size={14} />}
          />
          <div className="mt-3 flex flex-col gap-2 px-1">
            <NumberField
              label="Balance"
              value={creditCard.balance}
              onChange={(v) => onUpdateAccount('creditCard', { balance: v })}
              color={creditCard.color}
            />
            <NumberField
              label="Limit"
              value={creditCard.limit}
              onChange={(v) => onUpdateAccount('creditCard', { limit: v })}
              color={creditCard.color}
            />
          </div>

          <div className="mt-3 px-1 pb-1">
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

        <SimpleAccountCard
          account={wise}
          icon={<Globe size={14} />}
          onUpdateAccount={onUpdateAccount}
        />
      </div>
    </div>
  );
}
