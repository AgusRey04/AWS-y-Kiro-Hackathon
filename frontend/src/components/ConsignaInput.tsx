import { useCallback, useEffect, useRef } from 'react';

const MAX_LENGTH = 500;
const COUNTER_THRESHOLD = 400;

interface ConsignaInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  /** Enfoca el textarea al montar y deja el cursor al final del texto. */
  autoFocus?: boolean;
}

export default function ConsignaInput({
  value,
  onChange,
  maxLength = MAX_LENGTH,
  autoFocus = false,
}: ConsignaInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const remaining = maxLength - value.length;
  const showCounter = value.length > COUNTER_THRESHOLD;

  useEffect(() => {
    if (!autoFocus) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    // Solo al montar / al activarse el foco automático
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.length <= maxLength) {
        onChange(newValue);
      }
    },
    [onChange, maxLength]
  );

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder="¿Qué querés trabajar esta semana?"
        maxLength={maxLength}
        className="w-full min-h-[56px] rounded-2xl border border-border-light bg-white shadow-sm px-4 py-3 text-text-dark font-quicksand font-medium resize-y focus:outline-none focus:border-green-primary focus:ring-2 focus:ring-[#4A7856]/20 transition-colors placeholder:text-text-muted"
        aria-label="Consigna de planificación"
        rows={3}
      />
      {showCounter && (
        <span
          className="absolute bottom-2 right-3 text-xs text-text-muted"
          aria-live="polite"
          aria-label={`${remaining} caracteres restantes`}
        >
          {remaining}/{maxLength}
        </span>
      )}
    </div>
  );
}
