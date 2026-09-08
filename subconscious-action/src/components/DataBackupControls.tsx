import { useRef } from 'react';
import { Download, Upload } from 'lucide-react';

interface Props {
  onExport: () => void;
  onImport: (file: File) => void;
}

export default function DataBackupControls({ onExport, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2 px-1">
      <button
        type="button"
        onClick={onExport}
        className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#241C35]/70 shadow-sm ring-1 ring-[#241C35]/5 hover:text-[#5B3A9E]"
      >
        <Download className="h-3.5 w-3.5" />
        Експорт
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#241C35]/70 shadow-sm ring-1 ring-[#241C35]/5 hover:text-[#5B3A9E]"
      >
        <Upload className="h-3.5 w-3.5" />
        Імпорт
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImport(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
