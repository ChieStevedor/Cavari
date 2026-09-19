function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(rows: string[][]): string {
  const body = rows.map((row) => row.map(escapeCsvField).join(',')).join('\r\n');
  // Leading BOM so Excel detects UTF-8 and renders Cyrillic correctly.
  return `﻿${body}`;
}
