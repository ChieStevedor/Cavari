export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatCurrency(value: number): string {
  const rounded = round2(value);
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  return `${sign}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
