interface SuggestionChipsProps {
  chips: string[];
  onChipSelect: (chip: string) => void;
}

export default function SuggestionChips({ chips, onChipSelect }: SuggestionChipsProps) {
  // Enforce 2-5 chips visible (Req 14.4)
  const visibleChips = chips.slice(0, 5);

  if (visibleChips.length < 2) {
    return null;
  }

  return (
    <div
      className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 justify-items-stretch"
      role="group"
      aria-label="Sugerencias de consigna"
    >
      {visibleChips.map((chip, index) => (
        <button
          key={`${index}-${chip}`}
          type="button"
          onClick={() => onChipSelect(chip)}
          className="h-full flex items-center justify-center text-center sm:odd:last:col-span-2 bg-gray-100 text-text-dark rounded-full px-4 py-2 min-h-[40px] text-sm font-medium font-quicksand border border-border-light/60 transition-colors hover:bg-gray-200 active:scale-[0.98]"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
