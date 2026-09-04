import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { AFFIRMATION_BANK } from '../affirmations';

interface Props {
  customAffirmations: string[];
  onPick: (text: string) => void;
  onAddCustom: (text: string) => void;
  onDeleteCustom: (text: string) => void;
}

export default function AffirmationsBank({
  customAffirmations,
  onPick,
  onAddCustom,
  onDeleteCustom,
}: Props) {
  const [newAffirmation, setNewAffirmation] = useState('');

  function handleAdd() {
    const text = newAffirmation.trim();
    if (!text) return;
    onAddCustom(text);
    setNewAffirmation('');
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#241C35]/5">
      <h2 className="mb-1 text-sm font-semibold text-[#241C35]/80">Банк афірмацій</h2>
      <p className="mb-3 text-xs text-[#241C35]/50">
        Натисни на формулювання, щоб додати його в нотатку нижче.
      </p>

      <div className="flex flex-col gap-4">
        {AFFIRMATION_BANK.map((category) => (
          <div key={category.id}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5B3A9E]">
              {category.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              {category.items.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPick(item)}
                  className="rounded-full bg-[#241C35]/5 px-3 py-1.5 text-left text-xs text-[#241C35] hover:bg-[#5B3A9E]/10"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}

        {customAffirmations.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8A6A1F]">
              Мої афірмації
            </h3>
            <div className="flex flex-wrap gap-2">
              {customAffirmations.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1 rounded-full bg-[#C9A24B]/15 pl-3 pr-1 py-1.5 text-xs text-[#241C35]"
                >
                  <button type="button" onClick={() => onPick(item)} className="text-left">
                    {item}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCustom(item)}
                    aria-label="Видалити афірмацію"
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[#241C35]/40 hover:bg-[#241C35]/10 hover:text-[#241C35]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={newAffirmation}
          onChange={(e) => setNewAffirmation(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder="Додати свою афірмацію…"
          className="min-w-0 flex-1 rounded-xl border border-[#241C35]/10 bg-[#F5F1EA] px-3 py-2 text-sm text-[#241C35] outline-none focus:border-[#5B3A9E]/50"
        />
        <button
          type="button"
          onClick={handleAdd}
          aria-label="Додати"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5B3A9E] text-white hover:bg-[#4A2F82]"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
