import { useState } from 'react'
import { DriveView } from './components/DriveView'
import { ProduceView } from './components/ProduceView'
import { C } from './theme'

type View = 'drive' | 'produce'

export default function App() {
  const [view, setView] = useState<View>('drive')
  return (
    <div style={{ background: C.bg, color: C.text }} className="min-h-screen flex flex-col items-center px-4 py-6 font-sans">
      <div className="w-full max-w-sm flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs tracking-widest" style={{ color: C.amber }}>
            ROUTE · FRANÇAIS
          </div>
        </div>
        <div className="flex rounded-xl p-1" style={{ background: '#0F1113' }}>
          <button
            onClick={() => setView('drive')}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: view === 'drive' ? C.panel : 'transparent', color: view === 'drive' ? C.text : C.textDim }}
          >
            За кермом
          </button>
          <button
            onClick={() => setView('produce')}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: view === 'produce' ? C.panel : 'transparent', color: view === 'produce' ? C.text : C.textDim }}
          >
            Продукція
          </button>
        </div>
        {view === 'drive' ? <DriveView /> : <ProduceView />}
      </div>
    </div>
  )
}
