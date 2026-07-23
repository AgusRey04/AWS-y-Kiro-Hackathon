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
    <div className="flex flex-wrap gap-2" role="group" aria-label="Sugerencias de consigna">
      {visibleChips.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onChipSelect(chip)}
          className="bg-gray-100 text-text-dark rounded-full px-4 py-2 min-h-[40px] text-sm font-medium font-quicksand transition-colors hover:bg-gray-200 active:scale-95"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
