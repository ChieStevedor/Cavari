import { useEffect, useRef, useState } from 'react';
import { round2 } from '../format';

export default function NumberField({
  label,
  value,
  onChange,
  color,
  symbol = '$',
}: {
  label?: string;
  value: number | null | undefined;
  onChange: (value: number) => void;
  color: string;
  symbol?: string;
}) {
  const [text, setText] = useState(value == null ? '' : String(value));
  const lastEmitted = useRef(value);

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setText(value == null ? '' : String(value));
      lastEmitted.current = value;
    }
  }, [value]);

  function handleChange(raw: string) {
    setText(raw);
    if (raw.trim() === '') return;
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) return;
    const rounded = round2(parsed);
    lastEmitted.current = rounded;
    onChange(rounded);
  }

  const input = (
    <span className="flex items-center gap-1">
      <span className="text-[#8A8478]">{symbol}</span>
      <input
        type="number"
        value={text}
        placeholder="0"
        onChange={(e) => handleChange(e.target.value)}
        className="w-24 rounded-lg border border-[#E8E3D9] bg-white px-2 py-1 text-right font-medium outline-none focus:border-current"
        style={{ color }}
      />
    </span>
  );

  if (!label) return input;

  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      <span className="text-[#8A8478]">{label}</span>
      {input}
    </label>
  );
}
