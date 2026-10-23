import { useState } from 'react';
import { formatCompactCurrency, formatCurrency } from '../format';
import { monthRange, shiftYearMonth } from '../time';
import type { Transaction } from '../types';

interface TrendChartProps {
  transactions: Transaction[];
  balanceSnapshots: Record<string, number>;
  currentBalance: number;
}

const MONTH_SHORT_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC',
});

function formatMonthShort(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  return MONTH_SHORT_FORMATTER.format(new Date(Date.UTC(y, m - 1, 1)));
}

function monthsBetween(min: string, max: string): string[] {
  const result: string[] = [];
  let cursor = min;
  while (cursor <= max) {
    result.push(cursor);
    cursor = shiftYearMonth(cursor, 1);
  }
  return result;
}

type Series = { label: string; color: string; values: (number | null)[] };

const W = 300;
const H = 140;
const PAD_LEFT = 40;
const PAD_RIGHT = 8;
const PAD_Y_TOP = 14;
const PAD_Y_BOTTOM = 32;

function LineChart({ months, series }: { months: string[]; series: Series[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const n = months.length;

  const defined = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
  const dataMin = defined.length > 0 ? Math.min(...defined) : 0;
  const dataMax = defined.length > 0 ? Math.max(...defined) : 1;
  const span = dataMax - dataMin || Math.abs(dataMax) || 1;
  const domainMin = dataMin - span * 0.15;
  const domainMax = dataMax + span * 0.15;
  const innerHeight = H - PAD_Y_TOP - PAD_Y_BOTTOM;

  function xAt(i: number): number {
    return n <= 1 ? (PAD_LEFT + W - PAD_RIGHT) / 2 : PAD_LEFT + (i / (n - 1)) * (W - PAD_LEFT - PAD_RIGHT);
  }
  function yAt(v: number): number {
    const t = (v - domainMin) / (domainMax - domainMin);
    return PAD_Y_TOP + (1 - t) * innerHeight;
  }

  function buildPath(values: (number | null)[]): string {
    let d = '';
    let drawing = false;
    values.forEach((v, i) => {
      if (v === null) {
        drawing = false;
        return;
      }
      const x = xAt(i);
      const y = yAt(v);
      d += `${drawing ? ' L' : d ? ' M' : 'M'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      drawing = true;
    });
    return d;
  }

  function handlePointer(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fracX = (e.clientX - rect.left) / rect.width;
    const svgX = fracX * W;
    const idx = Math.max(
      0,
      Math.min(n - 1, Math.round(((svgX - PAD_LEFT) / (W - PAD_LEFT - PAD_RIGHT)) * (n - 1))),
    );
    setHoveredIndex(idx);
  }

  const showZeroLine = domainMin < 0 && domainMax > 0;
  const hovered = hoveredIndex !== null ? months[hoveredIndex] : null;
  const hoveredXFrac = hoveredIndex !== null ? xAt(hoveredIndex) / W : 0;
  const anchorClass =
    hoveredIndex === 0 ? '' : hoveredIndex === n - 1 ? '-translate-x-full' : '-translate-x-1/2';
  const rotateXLabels = n > 6;

  const yTicks = [0, 0.5, 1].map((t) => ({
    y: PAD_Y_TOP + t * innerHeight,
    value: domainMax - t * (domainMax - domainMin),
  }));

  return (
    <div>
      {series.length > 1 && (
        <div className="mb-2 flex items-center gap-3">
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-[11px] text-[#8A8478]">
              <span className="h-[3px] w-3 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setHoveredIndex(null)}
        >
          {yTicks.map(({ y, value }) => (
            <g key={y}>
              <line
                x1={PAD_LEFT}
                x2={W - PAD_RIGHT}
                y1={y}
                y2={y}
                stroke="#E8E3D9"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <text x={PAD_LEFT - 5} y={y} textAnchor="end" dominantBaseline="middle" fontSize={8} fill="#8A8478">
                {formatCompactCurrency(value)}
              </text>
            </g>
          ))}
          {showZeroLine && (
            <line
              x1={PAD_LEFT}
              x2={W - PAD_RIGHT}
              y1={yAt(0)}
              y2={yAt(0)}
              stroke="#8A8478"
              strokeWidth={1.25}
              vectorEffect="non-scaling-stroke"
            />
          )}

          {months.map((m, i) => {
            const x = xAt(i);
            const y = H - PAD_Y_BOTTOM + 11;
            return rotateXLabels ? (
              <text
                key={m}
                x={x}
                y={y}
                fontSize={7.5}
                fill="#8A8478"
                textAnchor="end"
                transform={`rotate(-40 ${x} ${y})`}
              >
                {formatMonthShort(m)}
              </text>
            ) : (
              <text key={m} x={x} y={y} fontSize={8} fill="#8A8478" textAnchor="middle">
                {formatMonthShort(m)}
              </text>
            );
          })}

          {hoveredIndex !== null && (
            <line
              x1={xAt(hoveredIndex)}
              x2={xAt(hoveredIndex)}
              y1={PAD_Y_TOP}
              y2={H - PAD_Y_BOTTOM}
              stroke="#8A8478"
              strokeWidth={1}
              strokeDasharray="3,3"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {series.map((s) => (
            <g key={s.label}>
              <path
                d={buildPath(s.values)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
              {s.values.map((v, i) =>
                v === null ? null : (
                  <circle
                    key={i}
                    cx={xAt(i)}
                    cy={yAt(v)}
                    r={hoveredIndex === i ? 3.5 : 2.5}
                    fill={s.color}
                  />
                ),
              )}
            </g>
          ))}
        </svg>

        {hovered !== null && (
          <div
            className={`pointer-events-none absolute top-0 ${anchorClass} rounded-lg bg-[#2B2620] px-2 py-1.5 text-[11px] text-white shadow-sm`}
            style={{ left: `${hoveredXFrac * 100}%` }}
          >
            <div className="font-medium text-white/70">{formatMonthShort(hovered)}</div>
            {series.map((s) => {
              const v = s.values[hoveredIndex!];
              return (
                <div key={s.label} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span>{v === null ? 'No data' : formatCurrency(v)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrendChart({
  transactions,
  balanceSnapshots,
  currentBalance,
}: TrendChartProps) {
  const { min: minYearMonth, max: maxYearMonth } = monthRange(transactions.map((t) => t.date));
  const months = monthsBetween(minYearMonth, maxYearMonth).slice(-12);

  const incomeValues = months.map((m) =>
    transactions
      .filter((t) => t.type === 'income' && t.date.slice(0, 7) === m)
      .reduce((sum, t) => sum + t.amount, 0),
  );
  const expenseValues = months.map((m) =>
    transactions
      .filter((t) => t.type === 'expense' && t.date.slice(0, 7) === m)
      .reduce((sum, t) => sum + t.amount, 0),
  );
  const balanceValues = months.map((m) =>
    m === maxYearMonth ? currentBalance : balanceSnapshots[m] ?? null,
  );

  const hasAnyData = months.length > 1;

  return (
    <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#8A8478]">
        Trends
      </h2>

      {!hasAnyData ? (
        <p className="text-xs text-[#8A8478]">Not enough history yet to show trends.</p>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="mb-1 text-xs font-semibold text-[#8A8478]">Total balance</h3>
            <LineChart
              months={months}
              series={[{ label: 'Total balance', color: '#2a78d6', values: balanceValues }]}
            />
          </div>

          <div>
            <h3 className="mb-1 text-xs font-semibold text-[#8A8478]">Income &amp; expenses</h3>
            <LineChart
              months={months}
              series={[
                { label: 'Income', color: '#2a78d6', values: incomeValues },
                { label: 'Expenses', color: '#eb6834', values: expenseValues },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
