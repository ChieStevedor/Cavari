import { ChevronLeft } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export default function Header({ title, subtitle, onBack }: Props) {
  return (
    <header className="flex items-center gap-3 pt-2">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Назад"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#241C35] shadow-sm ring-1 ring-[#241C35]/5"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold text-[#241C35]">{title}</h1>
        {subtitle && <p className="truncate text-sm text-[#241C35]/60">{subtitle}</p>}
      </div>
    </header>
  );
}
