import { Router } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { Efemeride, DatosEstaticos } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const datosEstaticosRoutes = Router();

// Load static data once at startup
const dataPath = join(__dirname, '..', 'data', 'efemerides.json');
const datosEstaticos: DatosEstaticos = JSON.parse(readFileSync(dataPath, 'utf-8'));

/**
 * Determines if an ephemeris date (MM-DD) falls within the next `dias` days from today.
 * Handles year boundary (e.g., today = Dec 28, ephemeris = Jan 6).
 */
function isWithinDays(fechaMmDd: string, dias: number, today: Date = new Date()): boolean {
  const [mm, dd] = fechaMmDd.split('-').map(Number);
  const currentYear = today.getFullYear();

  // Try current year
  let ephemerisDate = new Date(currentYear, mm - 1, dd);

  // If the ephemeris date has already passed this year, try next year
  const todayStart = new Date(currentYear, today.getMonth(), today.getDate());
  if (ephemerisDate < todayStart) {
    ephemerisDate = new Date(currentYear + 1, mm - 1, dd);
  }

  const diffMs = ephemerisDate.getTime() - todayStart.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays <= dias;
}

/**
 * Gets the current season for the Southern Hemisphere based on month.
 * Dec-Feb = verano, Mar-May = otoño, Jun-Aug = invierno, Sep-Nov = primavera
 */
function getCurrentSeason(today: Date = new Date()): string {
  const month = today.getMonth() + 1; // 1-12
  if (month === 12 || month === 1 || month === 2) return 'verano';
  if (month >= 3 && month <= 5) return 'otoño';
  if (month >= 6 && month <= 8) return 'invierno';
  return 'primavera';
}

/**
 * Returns the ephemerides that fall within the next `dias` days from `today`.
 * Pure function: date and data set are injectable for testing.
 */
function obtenerEfemeridesProximas(
  dias: number = 7,
  today: Date = new Date(),
  efemerides: Efemeride[] = datosEstaticos.efemerides
): Efemeride[] {
  return efemerides.filter((ef) => isWithinDays(ef.fecha, dias, today));
}

/**
 * Builds the suggestion chips for the Home screen.
 * - If at least one ephemeris falls within the next 7 days → chips based on those ephemerides
 *   (padded with season suggestions when there aren't enough ephemeris chips).
 * - Otherwise → chips based on the current season.
 * Always returns between 2 and 5 chips (as long as the static data provides enough).
 * Pure function: date and data set are injectable for testing.
 */
function construirSugerencias(
  today: Date = new Date(),
  datos: DatosEstaticos = datosEstaticos
): { chips: string[]; efemeridesProximas: Efemeride[]; origen: 'efemerides' | 'estacion' } {
  const efemeridesProximas = obtenerEfemeridesProximas(7, today, datos.efemerides);
  const origen: 'efemerides' | 'estacion' =
    efemeridesProximas.length > 0 ? 'efemerides' : 'estacion';

  let chips: string[] = efemeridesProximas.map((ef) => ef.sugerenciaConsigna);

  const seasonName = getCurrentSeason(today);
  const season = datos.estaciones.find((e) => e.nombre === seasonName);

  // If we don't have enough chips from ephemerides, pad with season-based
  if (chips.length < 2 && season) {
    const seasonChips = season.sugerencias.filter((s) => !chips.includes(s));
    chips = [...chips, ...seasonChips];
  }

  // Ensure at most 5 chips
  chips = chips.slice(0, 5);

  return { chips, efemeridesProximas, origen };
}

/**
 * GET /api/datos-estaticos/efemerides?dias=7
 * Returns ephemerides that fall within the next `dias` days from today.
 */
datosEstaticosRoutes.get('/efemerides', (req, res) => {
  const dias = Math.max(1, parseInt(req.query.dias as string) || 7);

  res.json({ data: obtenerEfemeridesProximas(dias) });
});

/**
 * GET /api/datos-estaticos/sugerencias
 * Returns suggestion chips:
 * - If ephemerides within 7 days → chips from their sugerenciaConsigna
 * - Otherwise → chips from the current season's suggestions
 * Always returns between 2 and 5 chips.
 */
datosEstaticosRoutes.get('/sugerencias', (_req, res) => {
  const { chips } = construirSugerencias();

  res.json({ data: chips });
});

// Export helpers for testing
export { isWithinDays, getCurrentSeason, obtenerEfemeridesProximas, construirSugerencias };
