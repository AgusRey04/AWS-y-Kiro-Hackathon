export type InputMode = 'voz' | 'texto';

interface VoiceTextToggleProps {
  mode: InputMode;
  onChange: (mode: InputMode) => void;
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
      <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.08A7 7 0 0 0 19 11z" />
    </svg>
  );
}

function TextIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M7 10h10M7 14h6" />
    </svg>
  );
}

const BASE_BUTTON =
  'flex items-center justify-center gap-2 rounded-full px-6 py-2 min-h-[40px] text-sm font-semibold font-quicksand transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-primary';

export default function VoiceTextToggle({ mode, onChange }: VoiceTextToggleProps) {
  return (
    <div
      className="inline-flex items-center rounded-full bg-white p-1 shadow-sm border border-border-light"
      role="radiogroup"
      aria-label="Modo de ingreso de consigna"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'voz'}
        onClick={() => onChange('voz')}
        className={`${BASE_BUTTON} ${
          mode === 'voz'
            ? 'bg-mostaza text-white shadow-sm'
            : 'bg-transparent text-text-muted hover:text-text-dark'
        }`}
      >
        <MicIcon className="w-4 h-4" />
        Voz
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'texto'}
        onClick={() => onChange('texto')}
        className={`${BASE_BUTTON} ${
          mode === 'texto'
            ? 'bg-mostaza text-white shadow-sm'
            : 'bg-transparent text-text-muted hover:text-text-dark'
        }`}
      >
        <TextIcon className="w-4 h-4" />
        Texto
      </button>
    </div>
  );
}
