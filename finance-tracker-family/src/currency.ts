import { round2 } from './format';
import type { Currency, ExchangeRates } from './types';

/** Converts an amount in `currency` to its EUR-equivalent using manually-set rates. */
export function toEur(amount: number, currency: Currency, rates: ExchangeRates): number {
  if (currency === 'EUR') return round2(amount);
  if (currency === 'UAH') return rates.uahPerEur ? round2(amount / rates.uahPerEur) : 0;
  if (currency === 'USD') return rates.usdPerEur ? round2(amount / rates.usdPerEur) : 0;
  return 0;
}
