import type { Accounts, AccountId } from '../types';
import { formatCurrency, round2 } from '../format';
import NumberField from './NumberField';

interface AccountsSectionProps {
  accounts: Accounts;
  onUpdateAccount: (id: AccountId, patch: Partial<Accounts[AccountId]>) => void;
}

// Real card art for these products isn't something that can be reliably and
// legally embedded here, so each gets a card-shaped badge (true ISO 7810
// card ratio, 85.6mm x 53.98mm ≈ 1.586:1) recreating that product's real
// colors, wordmark, and typography rather than a generic icon+color banner.
const BRAND_CARD: Record<AccountId, { background: string; content: React.ReactNode }> = {
  uber: {
    background: '#000000',
    content: <span className="text-base font-black tracking-tight text-white">Uber</span>,
  },
  uberVault: {
    // The real Uber Pro Card: Uber's black, plus its signature Pro/Eats
    // green accent, labeled "Save" for the set-aside purpose of this account.
    background: '#000000',
    content: (
      <div className="flex flex-col items-center gap-1">
        <span className="text-base font-black tracking-tight text-white">Uber</span>
        <span className="h-[3px] w-8 rounded-full" style={{ backgroundColor: '#06C167' }} />
        <span className="text-[10px] font-semibold tracking-wide text-white/80">Save</span>
      </div>
    ),
  },
  koho: {
    background: '#36186B',
    content: (
      <span
        className="text-lg font-bold lowercase tracking-tight"
        style={{ color: '#D1F300', fontFamily: "'Quicksand', sans-serif" }}
      >
        koho
      </span>
    ),
  },
  cibc: {
    background: '#C41F3E',
    content: <span className="text-base font-black uppercase tracking-wide text-white">CIBC</span>,
  },
  creditCard: {
    // The user's actual credit card: a CIBC Aventura, which comes in a
    // light silver/gray finish rather than CIBC's red corporate color.
    background: 'linear-gradient(135deg, #E7E7E7, #BFBFBF)',
    content: (
      <div className="flex flex-col items-center leading-none">
        <span className="text-sm font-black uppercase tracking-wide text-[#4a4a4a]">CIBC</span>
        <span className="mt-1 text-[11px] font-medium italic tracking-wide text-[#4a4a4a]">
          Aventura
        </span>
      </div>
    ),
  },
  wise: {
    background: '#9FE870',
    content: (
      <span className="text-base font-bold lowercase tracking-tight" style={{ color: '#163300' }}>
        wise
      </span>
    ),
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
        <SimpleAccountCard account={uber} onUpdateAccount={onUpdateAccount} />
        <SimpleAccountCard account={uberVault} onUpdateAccount={onUpdateAccount} />

        {/* Koho reserve */}
        <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
          <div className="flex items-center gap-3">
            <BrandCard accountId="koho" />
            <div className="flex flex-1 flex-col gap-1.5">
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
          </div>
          <div className="mt-3">
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

        <SimpleAccountCard account={cibc} onUpdateAccount={onUpdateAccount} />

        {/* Credit card (CIBC Aventura) */}
        <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
          <div className="flex items-center gap-3">
            <BrandCard accountId="creditCard" />
            <div className="flex flex-1 flex-col gap-1.5">
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

        <SimpleAccountCard account={wise} onUpdateAccount={onUpdateAccount} />
      </div>
    </div>
  );
}
