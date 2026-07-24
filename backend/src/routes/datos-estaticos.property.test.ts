import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fc from 'fast-check';
import {
  construirSugerencias,
  obtenerEfemeridesProximas,
  getCurrentSeason,
} from './datos-estaticos.js';
import type { DatosEstaticos } from '../models/index.js';

/**
 * Feature: edu-planner
 * Property test for ephemeris proximity detection and suggestion strategy
 * Validates: Requirements 12.1, 12.3, 12.4, 14.5
 */

const __dirname_ = dirname(fileURLToPath(import.meta.url));
const datosEstaticos: DatosEstaticos = JSON.parse(
  readFileSync(join(__dirname_, '..', 'data', 'efemerides.json'), 'utf-8')
);

/** Independent computation of the MM-DD keys covered by [hoy, hoy+7]. */
function clavesProximos7Dias(hoy: Date): Set<string> {
  const claves = new Set<string>();
  for (let i = 0; i <= 7; i++) {
    const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
    claves.add(
      `${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`
    );
  }
  return claves;
}

const fechaArbitraria = fc
  .tuple(
    fc.integer({ min: 2024, max: 2035 }),
    fc.integer({ min: 0, max: 11 }),
    fc.integer({ min: 1, max: 28 })
  )
  .map(([anio, mes, dia]) => new Date(anio, mes, dia));

describe('Feature: edu-planner, Property 17: Ephemeris proximity detection and suggestion strategy', () => {
  /**
   * **Validates: Requirements 12.1, 12.3, 12.4, 14.5**
   */
  it('detecta exactamente las efemérides dentro de los próximos 7 días', () => {
    fc.assert(
      fc.property(fechaArbitraria, (hoy) => {
        const claves = clavesProximos7Dias(hoy);
        const esperadas = datosEstaticos.efemerides
          .filter((ef) => claves.has(ef.fecha))
          .map((ef) => ef.fecha)
          .sort();

        const obtenidas = obtenerEfemeridesProximas(7, hoy, datosEstaticos.efemerides)
          .map((ef) => ef.fecha)
          .sort();

        expect(obtenidas).toEqual(esperadas);
      }),
      { numRuns: 300 }
    );
  });

  it('usa chips basados en efemérides cuando hay alguna próxima, y en la estación cuando no hay', () => {
    fc.assert(
      fc.property(fechaArbitraria, (hoy) => {
        const { chips, efemeridesProximas, origen } = construirSugerencias(hoy, datosEstaticos);

        const estacion = datosEstaticos.estaciones.find(
          (e) => e.nombre === getCurrentSeason(hoy)
        );
        expect(estacion).toBeDefined();

        if (efemeridesProximas.length > 0) {
          // Estrategia basada en efemérides (y banner informativo visible)
          expect(origen).toBe('efemerides');
          const sugerenciasEfemerides = efemeridesProximas.map((ef) => ef.sugerenciaConsigna);
          expect(chips.slice(0, Math.min(sugerenciasEfemerides.length, 5))).toEqual(
            sugerenciasEfemerides.slice(0, 5)
          );
          // Todo chip que no provenga de una efeméride próxima debe venir de la estación actual
          for (const chip of chips) {
            expect(
              sugerenciasEfemerides.includes(chip) || estacion!.sugerencias.includes(chip)
            ).toBe(true);
          }
        } else {
          // Sin efemérides próximas → chips de la estación actual, sin banner
          expect(origen).toBe('estacion');
          for (const chip of chips) {
            expect(estacion!.sugerencias).toContain(chip);
          }
        }

        // El banner informativo se muestra si y solo si hay una efeméride en los próximos 7 días
        expect(efemeridesProximas.length > 0).toBe(origen === 'efemerides');

        // Los chips siempre quedan dentro del rango visible permitido
        expect(chips.length).toBeGreaterThanOrEqual(2);
        expect(chips.length).toBeLessThanOrEqual(5);
      }),
      { numRuns: 300 }
    );
  });
});
