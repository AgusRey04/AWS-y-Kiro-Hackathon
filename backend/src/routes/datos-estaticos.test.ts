import { describe, it, expect } from 'vitest';
import { isWithinDays, getCurrentSeason } from './datos-estaticos.js';

describe('isWithinDays', () => {
  it('returns true for an ephemeris happening today', () => {
    const today = new Date(2024, 2, 8); // March 8
    expect(isWithinDays('03-08', 7, today)).toBe(true);
  });

  it('returns true for an ephemeris within 7 days', () => {
    const today = new Date(2024, 2, 5); // March 5
    expect(isWithinDays('03-08', 7, today)).toBe(true); // 3 days away
  });

  it('returns false for an ephemeris more than 7 days away', () => {
    const today = new Date(2024, 2, 1); // March 1
    expect(isWithinDays('03-21', 7, today)).toBe(false); // 20 days away
  });

  it('returns false for an ephemeris that already passed', () => {
    const today = new Date(2024, 2, 10); // March 10
    // March 8 already passed, so it should check next year's March 8
    expect(isWithinDays('03-08', 7, today)).toBe(false);
  });

  it('handles year boundary (Dec → Jan)', () => {
    const today = new Date(2024, 11, 28); // December 28
    expect(isWithinDays('01-02', 7, today)).toBe(true); // 5 days away (Jan 2 next year)
  });

  it('handles year boundary - just outside range', () => {
    const today = new Date(2024, 11, 20); // December 20
    expect(isWithinDays('01-06', 7, today)).toBe(false); // 17 days away
  });

  it('returns true for ephemeris exactly on the boundary day', () => {
    const today = new Date(2024, 0, 1); // January 1
    expect(isWithinDays('01-08', 7, today)).toBe(true); // exactly 7 days
  });

  it('returns false for ephemeris one day past the boundary', () => {
    const today = new Date(2024, 0, 1); // January 1
    expect(isWithinDays('01-09', 7, today)).toBe(false); // 8 days away
  });
});

describe('getCurrentSeason', () => {
  it('returns verano for December', () => {
    expect(getCurrentSeason(new Date(2024, 11, 15))).toBe('verano');
  });

  it('returns verano for January', () => {
    expect(getCurrentSeason(new Date(2024, 0, 10))).toBe('verano');
  });

  it('returns verano for February', () => {
    expect(getCurrentSeason(new Date(2024, 1, 20))).toBe('verano');
  });

  it('returns otoño for March', () => {
    expect(getCurrentSeason(new Date(2024, 2, 1))).toBe('otoño');
  });

  it('returns otoño for May', () => {
    expect(getCurrentSeason(new Date(2024, 4, 31))).toBe('otoño');
  });

  it('returns invierno for June', () => {
    expect(getCurrentSeason(new Date(2024, 5, 15))).toBe('invierno');
  });

  it('returns invierno for August', () => {
    expect(getCurrentSeason(new Date(2024, 7, 1))).toBe('invierno');
  });

  it('returns primavera for September', () => {
    expect(getCurrentSeason(new Date(2024, 8, 21))).toBe('primavera');
  });

  it('returns primavera for November', () => {
    expect(getCurrentSeason(new Date(2024, 10, 10))).toBe('primavera');
  });
});
