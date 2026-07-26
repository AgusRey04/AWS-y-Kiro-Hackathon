/**
 * Pure logic for inserting a suggestion chip's text into the consigna field.
 * Extracted from HomePage.handleChipSelect so it can be property-tested
 * without needing to render the full HomePage component tree.
 */

export const CONSIGNA_MAX_LENGTH = 500;

/**
 * Given the current consigna value and a selected suggestion chip, returns the
 * new consigna value:
 * - If the current value is empty or contains only whitespace, the chip text
 *   replaces it entirely.
 * - Otherwise, the chip text is appended after a single space.
 * In both cases, the result is truncated to `maxLength` characters.
 */
export function insertChip(
  currentValue: string,
  chip: string,
  maxLength: number = CONSIGNA_MAX_LENGTH
): string {
  if (currentValue.trim() === '') {
    return chip.slice(0, maxLength);
  }
  const combined = currentValue + ' ' + chip;
  return combined.slice(0, maxLength);
}
