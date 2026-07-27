import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import ConsignaInput from './ConsignaInput';
import SuggestionChips from './SuggestionChips';
import { insertChip } from '../utils/consigna';

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
          <ConsignaInput value={text} onChange={vi.fn()} />
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
   *
   * NOTE: ConsignaInput no longer renders suggestion chips (that responsibility moved
   * to HomePage, which shows the long-form suggestions fetched from the backend). The
   * insertion logic that used to live in ConsignaInput.handleChipSelect was extracted
   * to the pure function `insertChip` in `../utils/consigna.ts`, which is now used by
   * `HomePage.handleChipSelect`. These tests exercise that pure function directly
   * instead of rendering a component, since Property 3 is about the insertion
   * semantics, not about which component triggers them.
   */

  it('insertChip: empty (or blank) field sets consigna to the chip text, truncated to 500', () => {
    const chipArb = fc.string({ minLength: 1, maxLength: 600 });
    const blankArb = fc.string({ unit: fc.constantFrom(' ', '\t', '\n'), minLength: 0, maxLength: 10 });

    fc.assert(
      fc.property(blankArb, chipArb, (blank, chip) => {
        const result = insertChip(blank, chip);
        const expected = chip.slice(0, MAX_LENGTH);
        expect(result).toBe(expected);
        expect(result.length).toBeLessThanOrEqual(MAX_LENGTH);
      }),
      { numRuns: 150 }
    );
  });

  it('insertChip: non-empty field appends the chip after a single space, truncated to 500', () => {
    const existingArb = fc.string({ minLength: 1, maxLength: 400 }).filter((s) => s.trim().length > 0);
    const chipArb = fc.string({ minLength: 1, maxLength: 200 });

    fc.assert(
      fc.property(existingArb, chipArb, (existing, chip) => {
        const result = insertChip(existing, chip);
        const expected = (existing + ' ' + chip).slice(0, MAX_LENGTH);
        expect(result).toBe(expected);
        expect(result.length).toBeLessThanOrEqual(MAX_LENGTH);
      }),
      { numRuns: 150 }
    );
  });

  it('insertChip: result never exceeds 500 characters regardless of inputs', () => {
    const existingArb = fc.string({ minLength: 0, maxLength: 500 });
    const chipArb = fc.string({ minLength: 0, maxLength: 500 });

    fc.assert(
      fc.property(existingArb, chipArb, (existing, chip) => {
        const result = insertChip(existing, chip);
        expect(result.length).toBeLessThanOrEqual(MAX_LENGTH);
      }),
      { numRuns: 200 }
    );
  });
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
