const VANCOUVER_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Vancouver',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function vancouverToday(): string {
  return VANCOUVER_DATE_FORMATTER.format(new Date());
}

export function vancouverYearMonth(): string {
  return vancouverToday().slice(0, 7);
}
