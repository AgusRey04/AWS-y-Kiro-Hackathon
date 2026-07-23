import { useCallback } from 'react';
import SuggestionChips from './SuggestionChips';
import { getDefaultSuggestions } from '../utils/suggestions';

const MAX_LENGTH = 500;
const COUNTER_THRESHOLD = 400;

interface ConsignaInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  suggestions?: string[];
}

export default function ConsignaInput({
  value,
  onChange,
  maxLength = MAX_LENGTH,
  suggestions,
}: ConsignaInputProps) {
  const chips = suggestions ?? getDefaultSuggestions();
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

  const handleChipSelect = useCallback(
    (chip: string) => {
      if (value.length === 0) {
        // Set text if field is empty (Req 2.4)
        const newValue = chip.slice(0, maxLength);
        onChange(newValue);
      } else {
        // Append with space if field has content (Req 2.5)
        const appended = value + ' ' + chip;
        if (appended.length <= maxLength) {
          onChange(appended);
        } else {
          // Truncate to respect 500 char limit
          onChange(appended.slice(0, maxLength));
        }
      }
    },
    [value, onChange, maxLength]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder="¿Qué querés trabajar esta semana?"
          maxLength={maxLength}
          className="w-full min-h-[56px] rounded-xl border border-border-light px-4 py-3 text-text-dark font-quicksand font-medium resize-y focus:outline-none focus:border-green-primary transition-colors placeholder:text-text-muted"
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

      <SuggestionChips chips={chips} onChipSelect={handleChipSelect} />
    </div>
  );
}
