import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import ConsignaInput from './ConsignaInput';
import SuggestionChips from './SuggestionChips';
import { getDefaultSuggestions, getSeasonByMonth } from '../utils/suggestions';

/**
 * Feature: edu-planner
 * Property tests for text input and suggestion chips
 * Validates: Requirements 2.2, 2.4, 2.5, 14.4
 */

// --- Pure logic extracted from ConsignaInput for testability ---

const MAX_LENGTH = 500;
const COUNTER_THRESHOLD = 400;

function shouldShowCounter(textLength: number): boolean {
  return textLength > COUNTER_THRESHOLD;
}

function handleChangeLogic(newValue: string, maxLength: number): string | null {
  if (newValue.length <= maxLength) {
    return newValue;
  }
  return null; // rejected
}

function handleChipSelectLogic(
  currentValue: string,
  chip: string,
  maxLength: number
): string {
  if (currentValue.length === 0) {
    return chip.slice(0, maxLength);
  } else {
    const appended = currentValue + ' ' + chip;
    return appended.slice(0, maxLength);
  }
}

// --- Property Tests ---

describe('Feature: edu-planner, Property 2: Text input character limit and counter visibility', () => {
  /**
   * **Validates: Requirements 2.2**
   *
   * For any string entered in the text input field, the system SHALL enforce a maximum
   * of 500 characters and SHALL display a remaining-characters counter if and only if
   * the current text length exceeds 400 characters.
   */

  it('should enforce 500 character maximum: accepts strings ≤ 500 chars', () => {
    const validTextArb = fc.string({ minLength: 0, maxLength: 500 });

    fc.assert(
      fc.property(validTextArb, (text) => {
        const result = handleChangeLogic(text, MAX_LENGTH);
        expect(result).toBe(text);
      }),
      { numRuns: 150 }
    );
  });

  it('should enforce 500 character maximum: rejects strings > 500 chars', () => {
    const invalidTextArb = fc.string({ minLength: 501, maxLength: 600 });

    fc.assert(
      fc.property(invalidTextArb, (text) => {
        const result = handleChangeLogic(text, MAX_LENGTH);
        expect(result).toBeNull();
      }),
      { numRuns: 150 }
    );
  });

  it('should show counter if and only if text length > 400', () => {
    const textLengthArb = fc.integer({ min: 0, max: 600 });

    fc.assert(
      fc.property(textLengthArb, (length) => {
        const showCounter = shouldShowCounter(length);
        if (length > COUNTER_THRESHOLD) {
          expect(showCounter).toBe(true);
        } else {
          expect(showCounter).toBe(false);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('should render counter only when text exceeds 400 characters (component test)', () => {
    const textLengthArb = fc.integer({ min: 0, max: 500 });

    fc.assert(
      fc.property(textLengthArb, (length) => {
        const text = 'a'.repeat(length);
        const { unmount } = render(
          <ConsignaInput
            value={text}
            onChange={vi.fn()}
            suggestions={['Chip A', 'Chip B']}
          />
        );

        const counterRegex = /\/500/;
        if (length > COUNTER_THRESHOLD) {
          expect(screen.getByText(counterRegex)).toBeInTheDocument();
        } else {
          expect(screen.queryByText(counterRegex)).not.toBeInTheDocument();
        }

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('counter visibility is biconditional: visible ↔ length > 400', () => {
    const anyLengthArb = fc.integer({ min: 0, max: 500 });

    fc.assert(
      fc.property(anyLengthArb, (length) => {
        const counterVisible = shouldShowCounter(length);
        const expectedVisible = length > 400;
        expect(counterVisible).toBe(expectedVisible);
      }),
      { numRuns: 200 }
    );
  });
});

describe('Feature: edu-planner, Property 3: Suggestion chip insertion semantics', () => {
  /**
   * **Validates: Requirements 2.4, 2.5**
   *
   * For any suggestion chip text and any current field state, selecting a chip SHALL
   * result in the field containing exactly the chip text (if the field was empty) or
   * the existing text followed by a space followed by the chip text (if the field was
   * non-empty), with the total never exceeding 500 characters.
   */

  it('when field is empty, result equals chip text truncated to 500 chars', () => {
    const chipArb = fc.string({ minLength: 1, maxLength: 600 });

    fc.assert(
      fc.property(chipArb, (chip) => {
        const result = handleChipSelectLogic('', chip, MAX_LENGTH);
        const expected = chip.slice(0, MAX_LENGTH);
        expect(result).toBe(expected);
        expect(result.length).toBeLessThanOrEqual(MAX_LENGTH);
      }),
      { numRuns: 150 }
    );
  });

  it('when field is non-empty, result equals existing + space + chip, truncated to 500', () => {
    const existingArb = fc.string({ minLength: 1, maxLength: 400 });
    const chipArb = fc.string({ minLength: 1, maxLength: 200 });

    fc.assert(
      fc.property(existingArb, chipArb, (existing, chip) => {
        const result = handleChipSelectLogic(existing, chip, MAX_LENGTH);
        const expectedFull = existing + ' ' + chip;
        const expected = expectedFull.slice(0, MAX_LENGTH);
        expect(result).toBe(expected);
        expect(result.length).toBeLessThanOrEqual(MAX_LENGTH);
      }),
      { numRuns: 150 }
    );
  });

  it('result NEVER exceeds 500 characters regardless of inputs', () => {
    const existingArb = fc.string({ minLength: 0, maxLength: 500 });
    const chipArb = fc.string({ minLength: 0, maxLength: 500 });

    fc.assert(
      fc.property(existingArb, chipArb, (existing, chip) => {
        const result = handleChipSelectLogic(existing, chip, MAX_LENGTH);
        expect(result.length).toBeLessThanOrEqual(MAX_LENGTH);
      }),
      { numRuns: 200 }
    );
  });

  it('chip insertion via component: empty field sets chip text', async () => {
    // Generate unique chip texts to avoid React key collisions
    const chipTextsArb = fc.uniqueArray(
      fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      { minLength: 2, maxLength: 5 }
    );

    await fc.assert(
      fc.asyncProperty(chipTextsArb, async (chips) => {
        const onChange = vi.fn();
        const { unmount } = render(
          <ConsignaInput value="" onChange={onChange} suggestions={chips} />
        );

        const firstChipButton = screen.getAllByRole('button')[0];
        await userEvent.click(firstChipButton);

        expect(onChange).toHaveBeenCalledWith(chips[0].slice(0, MAX_LENGTH));

        unmount();
        onChange.mockClear();
      }),
      { numRuns: 100 }
    );
  }, 120000);

  it('chip insertion via component: non-empty field appends with space', async () => {
    const existingTextArb = fc.string({ minLength: 1, maxLength: 100 }).filter(
      (s) => s.trim().length > 0
    );
    // Generate unique chip texts to avoid React key collisions
    const chipTextsArb = fc.uniqueArray(
      fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      { minLength: 2, maxLength: 5 }
    );

    await fc.assert(
      fc.asyncProperty(existingTextArb, chipTextsArb, async (existing, chips) => {
        const onChange = vi.fn();
        const { unmount } = render(
          <ConsignaInput value={existing} onChange={onChange} suggestions={chips} />
        );

        const firstChipButton = screen.getAllByRole('button')[0];
        await userEvent.click(firstChipButton);

        const expected = (existing + ' ' + chips[0]).slice(0, MAX_LENGTH);
        expect(onChange).toHaveBeenCalledWith(expected);

        unmount();
        onChange.mockClear();
      }),
      { numRuns: 100 }
    );
  }, 120000);
});

describe('Feature: edu-planner, Property 18: Suggestion chip count bounds', () => {
  /**
   * **Validates: Requirements 14.4**
   *
   * For any data state (ephemerides and season data), the Home screen SHALL display
   * between 2 and 5 suggestion chips inclusive, never more, never fewer.
   */

  it('SuggestionChips renders between 2 and 5 chips or nothing (when < 2 provided)', () => {
    const chipsArb = fc.array(
      fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
      { minLength: 0, maxLength: 10 }
    );

    fc.assert(
      fc.property(chipsArb, (chips) => {
        const { container, unmount } = render(
          <SuggestionChips chips={chips} onChipSelect={vi.fn()} />
        );

        const buttons = container.querySelectorAll('button');

        if (chips.length < 2) {
          // Should render nothing
          expect(buttons.length).toBe(0);
        } else {
          // Should render between 2 and 5 chips
          const expectedCount = Math.min(chips.length, 5);
          expect(buttons.length).toBe(expectedCount);
          expect(buttons.length).toBeGreaterThanOrEqual(2);
          expect(buttons.length).toBeLessThanOrEqual(5);
        }

        unmount();
      }),
      { numRuns: 150 }
    );
  });

  it('getDefaultSuggestions always returns between 2 and 5 items for any date', () => {
    // Generate arbitrary months (1-12) to test all seasons
    const monthArb = fc.integer({ min: 1, max: 12 });
    const dayArb = fc.integer({ min: 1, max: 28 });
    const yearArb = fc.integer({ min: 2020, max: 2030 });

    fc.assert(
      fc.property(monthArb, dayArb, yearArb, (month, day, year) => {
        const date = new Date(year, month - 1, day);
        const suggestions = getDefaultSuggestions(date);

        expect(suggestions.length).toBeGreaterThanOrEqual(2);
        expect(suggestions.length).toBeLessThanOrEqual(5);
      }),
      { numRuns: 200 }
    );
  });

  it('getSeasonByMonth returns a valid season for every month 1-12', () => {
    const monthArb = fc.integer({ min: 1, max: 12 });

    fc.assert(
      fc.property(monthArb, (month) => {
        const season = getSeasonByMonth(month);
        expect(season).toBeDefined();
        expect(season!.sugerencias.length).toBeGreaterThanOrEqual(2);
      }),
      { numRuns: 100 }
    );
  });

  it('SuggestionChips never renders more than 5 chips even with large input arrays', () => {
    const largeChipsArb = fc.array(
      fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
      { minLength: 6, maxLength: 20 }
    );

    fc.assert(
      fc.property(largeChipsArb, (chips) => {
        const { container, unmount } = render(
          <SuggestionChips chips={chips} onChipSelect={vi.fn()} />
        );

        const buttons = container.querySelectorAll('button');
        expect(buttons.length).toBeLessThanOrEqual(5);
        // Since we have >= 6 chips, it should render exactly 5
        expect(buttons.length).toBe(5);

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('SuggestionChips renders nothing when fewer than 2 chips provided', () => {
    const fewChipsArb = fc.array(
      fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
      { minLength: 0, maxLength: 1 }
    );

    fc.assert(
      fc.property(fewChipsArb, (chips) => {
        const { container, unmount } = render(
          <SuggestionChips chips={chips} onChipSelect={vi.fn()} />
        );

        const buttons = container.querySelectorAll('button');
        expect(buttons.length).toBe(0);
        expect(container.firstChild).toBeNull();

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
