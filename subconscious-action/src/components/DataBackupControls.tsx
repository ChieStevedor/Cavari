import { useRef } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';

interface Props {
  onExportJson: () => void;
  onExportCsv: () => void;
  onImport: (file: File) => void;
}

export default function DataBackupControls({ onExportJson, onExportCsv, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-2 px-1">
      <button
        type="button"
        onClick={onExportJson}
        title="Повний бекап у JSON — для відновлення через Імпорт"
        className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#241C35]/70 shadow-sm ring-1 ring-[#241C35]/5 hover:text-[#5B3A9E]"
      >
        <Download className="h-3.5 w-3.5" />
        Бекап
      </button>
      <button
        type="button"
        onClick={onExportCsv}
        title="Усі записи таблицею — відкривається в Excel / Google Таблицях"
        className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#241C35]/70 shadow-sm ring-1 ring-[#241C35]/5 hover:text-[#5B3A9E]"
      >
        <FileSpreadsheet className="h-3.5 w-3.5" />
        CSV
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        title="Відновити з файлу бекапу (JSON)"
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
