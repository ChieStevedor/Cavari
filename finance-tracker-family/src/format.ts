import type { Currency } from './types';

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  UAH: '₴',
  EUR: '€',
  USD: '$',
};

export function currencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency];
}

export function formatCurrency(value: number, currency: Currency = 'EUR'): string {
  const rounded = round2(value);
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  const amount = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${CURRENCY_SYMBOLS[currency]}${amount}`;
}
