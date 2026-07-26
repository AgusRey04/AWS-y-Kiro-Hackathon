import { useCallback } from 'react';

const MAX_LENGTH = 500;
const COUNTER_THRESHOLD = 400;

interface ConsignaInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export default function ConsignaInput({
  value,
  onChange,
  maxLength = MAX_LENGTH,
}: ConsignaInputProps) {
  const remaining = maxLength - value.length;
  const showCounter = value.length > COUNTER_THRESHOLD;

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
        value={value}
        onChange={handleChange}
        placeholder="¿Qué querés trabajar esta semana?"
        maxLength={maxLength}
        className="w-full min-h-[56px] rounded-xl border border-border-light px-4 py-3 text-text-dark font-quicksand font-medium resize-y focus:outline-none focus:border-green-primary focus:ring-2 focus:ring-[#4A7856]/20 transition-colors placeholder:text-text-muted"
        aria-label="Consigna de planificación"
        rows={2}
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
