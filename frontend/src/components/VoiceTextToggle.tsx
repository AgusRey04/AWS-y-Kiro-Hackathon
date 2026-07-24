export type InputMode = 'voz' | 'texto';

interface VoiceTextToggleProps {
  mode: InputMode;
  onChange: (mode: InputMode) => void;
}

export default function VoiceTextToggle({ mode, onChange }: VoiceTextToggleProps) {
  return (
    <div
      className="inline-flex rounded-full bg-gray-100 p-1"
      role="radiogroup"
      aria-label="Modo de ingreso de consigna"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'voz'}
        onClick={() => onChange('voz')}
        className={`rounded-full px-5 py-2 min-h-[40px] text-sm font-semibold font-quicksand transition-all active:scale-95 ${
          mode === 'voz'
            ? 'bg-green-primary text-white shadow-sm'
            : 'bg-transparent text-text-muted hover:text-text-dark'
        }`}
      >
        Voz
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'texto'}
        onClick={() => onChange('texto')}
        className={`rounded-full px-5 py-2 min-h-[40px] text-sm font-semibold font-quicksand transition-all active:scale-95 ${
          mode === 'texto'
            ? 'bg-green-primary text-white shadow-sm'
            : 'bg-transparent text-text-muted hover:text-text-dark'
        }`}
      >
        Texto
      </button>
    </div>
  );
}
