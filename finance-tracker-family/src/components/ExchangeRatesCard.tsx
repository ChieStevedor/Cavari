import NumberField from './NumberField';
import type { ExchangeRates } from '../types';

interface ExchangeRatesCardProps {
  rates: ExchangeRates;
  onUpdate: (patch: Partial<ExchangeRates>) => void;
}

export default function ExchangeRatesCard({ rates, onUpdate }: ExchangeRatesCardProps) {
  return (
    <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#8A8478]">
        Курсы валют
      </h2>
      <div className="flex flex-col gap-2">
        <NumberField
          label="1 EUR = ? UAH"
          value={rates.uahPerEur}
          onChange={(v) => onUpdate({ uahPerEur: v })}
          color="#4A8F31"
          symbol=""
        />
        <NumberField
          label="1 EUR = ? USD"
          value={rates.usdPerEur}
          onChange={(v) => onUpdate({ usdPerEur: v })}
          color="#1F3B5C"
          symbol=""
        />
      </div>
      <p className="mt-2 text-xs text-[#8A8478]">
        Используются для общего баланса и итогов в евро. Обновляйте вручную при изменении курса.
      </p>
    </div>
  );
}
