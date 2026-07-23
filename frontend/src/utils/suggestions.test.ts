import { describe, it, expect } from 'vitest';
import { getDefaultSuggestions, getSeasonByMonth } from './suggestions';

describe('getSeasonByMonth', () => {
  it('returns verano for December', () => {
    expect(getSeasonByMonth(12)?.nombre).toBe('verano');
  });

  it('returns verano for January', () => {
    expect(getSeasonByMonth(1)?.nombre).toBe('verano');
  });

  it('returns otoño for March', () => {
    expect(getSeasonByMonth(3)?.nombre).toBe('otoño');
  });

  it('returns invierno for June', () => {
    expect(getSeasonByMonth(6)?.nombre).toBe('invierno');
  });

  it('returns primavera for September', () => {
    expect(getSeasonByMonth(9)?.nombre).toBe('primavera');
  });

  it('returns undefined for invalid month', () => {
    expect(getSeasonByMonth(0)).toBeUndefined();
    expect(getSeasonByMonth(13)).toBeUndefined();
  });
});

describe('getDefaultSuggestions', () => {
  it('returns between 2 and 5 suggestions', () => {
    const suggestions = getDefaultSuggestions();
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  it('returns verano suggestions in January', () => {
    const date = new Date(2024, 0, 15); // January
    const suggestions = getDefaultSuggestions(date);
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions[0]).toContain('agua');
  });

  it('returns otoño suggestions in April', () => {
    const date = new Date(2024, 3, 10); // April
    const suggestions = getDefaultSuggestions(date);
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    // Should have otoño-related content
    expect(suggestions.some((s) => s.toLowerCase().includes('hojas') || s.toLowerCase().includes('otoñ'))).toBe(true);
  });

  it('returns invierno suggestions in July', () => {
    const date = new Date(2024, 6, 1); // July
    const suggestions = getDefaultSuggestions(date);
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.some((s) => s.toLowerCase().includes('hielo') || s.toLowerCase().includes('sopa'))).toBe(true);
  });

  it('returns primavera suggestions in October', () => {
    const date = new Date(2024, 9, 1); // October
    const suggestions = getDefaultSuggestions(date);
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.some((s) => s.toLowerCase().includes('semilla') || s.toLowerCase().includes('germinación'))).toBe(true);
  });

  it('always returns strings', () => {
    const suggestions = getDefaultSuggestions();
    suggestions.forEach((s) => {
      expect(typeof s).toBe('string');
      expect(s.length).toBeGreaterThan(0);
    });
  });
});
