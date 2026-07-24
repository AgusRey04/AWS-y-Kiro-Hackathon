import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import VoiceRecorder from './VoiceRecorder';

/**
 * Feature: edu-planner
 * Property 1: Voice transcript truncation at character limit
 * Validates: Requirements 1.8
 *
 * For any audio transcript produced by the Web Speech API, the Módulo de Voz
 * SHALL truncate the deposited text to exactly 500 characters and stop recording,
 * regardless of the content or language of the spoken input.
 */

// --- Mock SpeechRecognition ---

class MockSpeechRecognition {
  lang = '';
  continuous = false;
  interimResults = false;
  onstart: (() => void) | null = null;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;

  start = vi.fn(() => {
    if (this.onstart) this.onstart();
  });

  stop = vi.fn(() => {
    if (this.onend) this.onend();
  });

  abort = vi.fn();
}

let mockRecognitionInstance: MockSpeechRecognition;

function setupSpeechRecognitionSupport() {
  mockRecognitionInstance = new MockSpeechRecognition();
  (window as unknown as Record<string, unknown>).SpeechRecognition = vi.fn(
    () => mockRecognitionInstance
  );
}

// --- Pure logic extracted for testability ---

const DEFAULT_MAX_CHARS = 500;

/**
 * Pure truncation logic as implemented in VoiceRecorder.onresult:
 * If combined transcript length >= maxChars, truncate to exactly maxChars characters.
 * Returns { shouldTruncate, result } where result is the truncated or original text.
 */
function truncationLogic(
  combined: string,
  maxChars: number
): { shouldTruncate: boolean; result: string } {
  if (combined.length >= maxChars) {
    return { shouldTruncate: true, result: combined.slice(0, maxChars) };
  }
  return { shouldTruncate: false, result: combined };
}

// --- Property Tests ---

describe('Feature: edu-planner, Property 1: Voice transcript truncation at character limit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setupSpeechRecognitionSupport();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /**
   * **Validates: Requirements 1.8**
   *
   * Pure logic: For any text with length >= maxChars, truncation produces
   * exactly maxChars characters using text.slice(0, maxChars).
   */
  it('truncation always produces exactly maxChars characters for text >= maxChars', () => {
    const longTextArb = fc.string({ minLength: DEFAULT_MAX_CHARS, maxLength: 2000 });

    fc.assert(
      fc.property(longTextArb, (text) => {
        const { shouldTruncate, result } = truncationLogic(text, DEFAULT_MAX_CHARS);
        expect(shouldTruncate).toBe(true);
        expect(result.length).toBe(DEFAULT_MAX_CHARS);
        expect(result).toBe(text.slice(0, DEFAULT_MAX_CHARS));
      }),
      { numRuns: 150 }
    );
  });

  it('truncation is exactly text.slice(0, maxChars) - never more, never less', () => {
    const maxCharsArb = fc.integer({ min: 1, max: 1000 });
    const textArb = fc.string({ minLength: 1, maxLength: 2000 });

    fc.assert(
      fc.property(maxCharsArb, textArb, (maxChars, text) => {
        // Only test cases where truncation triggers
        fc.pre(text.length >= maxChars);

        const { shouldTruncate, result } = truncationLogic(text, maxChars);
        expect(shouldTruncate).toBe(true);
        expect(result.length).toBe(maxChars);
        expect(result).toBe(text.slice(0, maxChars));
      }),
      { numRuns: 200 }
    );
  });

  it('text at exactly maxChars length also triggers truncation (>= condition)', () => {
    const maxCharsArb = fc.integer({ min: 1, max: 1000 });

    fc.assert(
      fc.property(maxCharsArb, (maxChars) => {
        // Generate text of exactly maxChars length
        const text = 'x'.repeat(maxChars);
        const { shouldTruncate, result } = truncationLogic(text, maxChars);
        expect(shouldTruncate).toBe(true);
        expect(result.length).toBe(maxChars);
        expect(result).toBe(text);
      }),
      { numRuns: 100 }
    );
  });

  it('text shorter than maxChars does NOT trigger truncation', () => {
    const shortTextArb = fc.string({ minLength: 0, maxLength: DEFAULT_MAX_CHARS - 1 });

    fc.assert(
      fc.property(shortTextArb, (text) => {
        const { shouldTruncate, result } = truncationLogic(text, DEFAULT_MAX_CHARS);
        expect(shouldTruncate).toBe(false);
        expect(result).toBe(text);
        expect(result.length).toBeLessThan(DEFAULT_MAX_CHARS);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * Component-level test: For any arbitrary text exceeding maxChars,
   * the VoiceRecorder component calls onTranscript with exactly maxChars characters
   * and calls onError with 'max-length'.
   */
  it('component calls onTranscript with truncated text and onError with max-length for any oversized input', () => {
    // Use a smaller maxChars to keep test fast but still property-based
    const maxCharsArb = fc.integer({ min: 5, max: 100 });
    const textArb = fc.string({ minLength: 1, maxLength: 500 });

    fc.assert(
      fc.property(maxCharsArb, textArb, (maxChars, text) => {
        // Only test when text would trigger truncation
        fc.pre(text.length >= maxChars);

        const onTranscript = vi.fn();
        const onPartialTranscript = vi.fn();
        const onError = vi.fn();

        const { unmount } = render(
          <VoiceRecorder
            onTranscript={onTranscript}
            onPartialTranscript={onPartialTranscript}
            onError={onError}
            maxChars={maxChars}
            lang="es-AR"
          />
        );

        // Start recording
        fireEvent.click(screen.getByRole('button', { name: /iniciar grabación/i }));

        // Simulate onresult with text exceeding maxChars
        act(() => {
          mockRecognitionInstance.onresult?.({
            results: [
              { 0: { transcript: text }, isFinal: true, length: 1 },
            ],
            resultIndex: 0,
            length: 1,
          });
        });

        // Verify truncation: onTranscript receives exactly maxChars characters
        expect(onTranscript).toHaveBeenCalledWith(text.slice(0, maxChars));
        expect(onTranscript.mock.calls[0][0].length).toBe(maxChars);

        // Verify onError is called with 'max-length'
        expect(onError).toHaveBeenCalledWith('max-length');

        // Verify recording stopped (stop was called on recognition)
        expect(mockRecognitionInstance.stop).toHaveBeenCalled();

        unmount();

        // Reset mocks for next iteration
        onTranscript.mockClear();
        onPartialTranscript.mockClear();
        onError.mockClear();

        // Re-setup mock for next iteration
        setupSpeechRecognitionSupport();
      }),
      { numRuns: 100 }
    );
  });

  it('component truncation works regardless of content (unicode, special chars, mixed languages)', () => {
    const maxChars = 50;
    // Generate diverse strings with special characters to test language/content independence
    const unicodeTextArb = fc.string({ minLength: maxChars, maxLength: 200 });

    fc.assert(
      fc.property(unicodeTextArb, (text) => {
        const onTranscript = vi.fn();
        const onPartialTranscript = vi.fn();
        const onError = vi.fn();

        const { unmount } = render(
          <VoiceRecorder
            onTranscript={onTranscript}
            onPartialTranscript={onPartialTranscript}
            onError={onError}
            maxChars={maxChars}
            lang="es-AR"
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /iniciar grabación/i }));

        act(() => {
          mockRecognitionInstance.onresult?.({
            results: [
              { 0: { transcript: text }, isFinal: true, length: 1 },
            ],
            resultIndex: 0,
            length: 1,
          });
        });

        // Regardless of content/language, truncation is always at character limit
        expect(onTranscript).toHaveBeenCalledWith(text.slice(0, maxChars));
        expect(onTranscript.mock.calls[0][0].length).toBe(maxChars);
        expect(onError).toHaveBeenCalledWith('max-length');

        unmount();
        onTranscript.mockClear();
        onPartialTranscript.mockClear();
        onError.mockClear();
        setupSpeechRecognitionSupport();
      }),
      { numRuns: 100 }
    );
  });
});
