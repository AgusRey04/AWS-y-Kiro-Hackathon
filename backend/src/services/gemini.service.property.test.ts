import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fc from 'fast-check';
import { obtenerEstacion, validarRespuesta } from './gemini.service.js';
import { getCurrentSeason } from '../routes/datos-estaticos.js';
import type { DatosEstaticos } from '../models/index.js';

/**
 * Feature: edu-planner
 * Property tests for Gemini response parsing and season mapping
 * Validates: Requirements 3.3, 3.5, 12.2
 */

const __dirname_ = dirname(fileURLToPath(import.meta.url));
const datosEstaticos: DatosEstaticos = JSON.parse(
  readFileSync(join(__dirname_, '..', 'data', 'efemerides.json'), 'utf-8')
);

const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const;

// --- Generators ---

/** Non-empty text once trimmed (the validator rejects blank strings). */
const textoNoVacio = (maxLength = 40) =>
  fc.string({ minLength: 1, maxLength }).map((s) => `texto ${s}`);

const fechaIso = fc
  .integer({ min: 0, max: 3650 })
  .map((offset) => new Date(Date.UTC(2024, 0, 1) + offset * 86_400_000).toISOString().slice(0, 10));

const actividadDe = (dia: string) =>
  fc.record({
    dia: fc.constant(dia),
    titulo: textoNoVacio(60),
    descripcion: textoNoVacio(120),
  });

/** At least one activity per weekday, plus 0-5 extra activities on random weekdays. */
const actividadesValidas = fc
  .tuple(
    fc.tuple(...DIAS_SEMANA.map((d) => actividadDe(d))),
    fc.array(fc.constantFrom(...DIAS_SEMANA).chain((d) => actividadDe(d)), {
      minLength: 0,
      maxLength: 5,
    })
  )
  .map(([base, extra]) => [...base, ...extra]);

/** A structurally valid Gemini response, as described by the response schema. */
const respuestaValida = fc.record({
  titulo: textoNoVacio(80),
  fechaInicio: fechaIso,
  fechaFin: fechaIso,
  objetivos: fc.array(textoNoVacio(80), { minLength: 2, maxLength: 4 }),
  areaCurricular: textoNoVacio(40),
  ambitoExperiencia: textoNoVacio(40),
  actividades: actividadesValidas,
  materiales: fc.array(
    fc.record({ nombre: textoNoVacio(30), icono: fc.constantFrom('🎨', '📚', '🍂', '✂️') }),
    { minLength: 0, maxLength: 8 }
  ),
  adaptaciones: fc.array(
    fc.record({
      categoria: fc.constantFrom('motriz', 'cognitiva', 'sensorial', 'socioemocional'),
      titulo: textoNoVacio(40),
      descripcion: textoNoVacio(120),
    }),
    { minLength: 0, maxLength: 5 }
  ),
  fundamentacion: textoNoVacio(200),
});

// --- Property Tests ---

describe('Feature: edu-planner, Property 5: Gemini response structural integrity', () => {
  /**
   * **Validates: Requirements 3.3, 3.5**
   */
  it('acepta toda respuesta con la estructura completa esperada', () => {
    fc.assert(
      fc.property(respuestaValida, (resp) => {
        expect(validarRespuesta(resp)).toBe(true);

        // La respuesta aceptada contiene todo lo que exige la propiedad
        expect(resp.titulo.trim().length).toBeGreaterThan(0);
        expect(resp.fechaInicio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(resp.fechaFin).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(resp.objetivos.length).toBeGreaterThanOrEqual(2);
        expect(resp.objetivos.length).toBeLessThanOrEqual(4);
        expect(resp.areaCurricular.trim().length).toBeGreaterThan(0);
        expect(resp.ambitoExperiencia.trim().length).toBeGreaterThan(0);
        for (const dia of DIAS_SEMANA) {
          expect(resp.actividades.some((a) => a.dia === dia)).toBe(true);
        }
        expect(Array.isArray(resp.materiales)).toBe(true);
        expect(Array.isArray(resp.adaptaciones)).toBe(true);
        expect(resp.fundamentacion.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 200 }
    );
  });

  it('rechaza toda respuesta que rompe alguna condición estructural', () => {
    const mutaciones = [
      'titulo-vacio',
      'sin-fecha-inicio',
      'sin-fecha-fin',
      'pocos-objetivos',
      'muchos-objetivos',
      'area-vacia',
      'ambito-vacio',
      'falta-dia',
      'actividad-sin-descripcion',
      'materiales-no-array',
      'adaptaciones-no-array',
      'fundamentacion-vacia',
    ] as const;

    fc.assert(
      fc.property(
        respuestaValida,
        fc.constantFrom(...mutaciones),
        fc.constantFrom(...DIAS_SEMANA),
        (base, mutacion, dia) => {
          const resp: Record<string, unknown> = { ...base };

          switch (mutacion) {
            case 'titulo-vacio':
              resp.titulo = '   ';
              break;
            case 'sin-fecha-inicio':
              resp.fechaInicio = '';
              break;
            case 'sin-fecha-fin':
              delete resp.fechaFin;
              break;
            case 'pocos-objetivos':
              resp.objetivos = base.objetivos.slice(0, 1);
              break;
            case 'muchos-objetivos':
              resp.objetivos = [...base.objetivos, 'a', 'b', 'c'];
              break;
            case 'area-vacia':
              resp.areaCurricular = '';
              break;
            case 'ambito-vacio':
              resp.ambitoExperiencia = ' ';
              break;
            case 'falta-dia':
              resp.actividades = base.actividades.filter((a) => a.dia !== dia);
              break;
            case 'actividad-sin-descripcion':
              resp.actividades = base.actividades.map((a, i) =>
                i === 0 ? { ...a, descripcion: '' } : a
              );
              break;
            case 'materiales-no-array':
              resp.materiales = 'no es un array';
              break;
            case 'adaptaciones-no-array':
              resp.adaptaciones = null;
              break;
            case 'fundamentacion-vacia':
              resp.fundamentacion = '';
              break;
          }

          expect(validarRespuesta(resp)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('rechaza valores que no son objetos', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
        (valor) => {
          expect(validarRespuesta(valor)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: edu-planner, Property 16: Date-to-season mapping (Southern Hemisphere)', () => {
  /**
   * **Validates: Requirements 12.2**
   */
  const estacionEsperada = (mes: number): string => {
    const estacion = datosEstaticos.estaciones.find((e) => e.meses.includes(mes));
    if (!estacion) throw new Error(`Mes sin estación definida: ${mes}`);
    return estacion.nombre;
  };

  const fechaArbitraria = fc
    .tuple(
      fc.integer({ min: 1970, max: 2100 }),
      fc.integer({ min: 0, max: 11 }),
      fc.integer({ min: 1, max: 28 })
    )
    .map(([anio, mes, dia]) => new Date(anio, mes, dia));

  it('mapea cualquier fecha a la estación del hemisferio sur correcta', () => {
    fc.assert(
      fc.property(fechaArbitraria, (fecha) => {
        const esperada = estacionEsperada(fecha.getMonth() + 1);
        expect(obtenerEstacion(fecha)).toBe(esperada);
        expect(getCurrentSeason(fecha)).toBe(esperada);
      }),
      { numRuns: 300 }
    );
  });

  it('mantiene la misma estación para todos los días de un mismo mes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1970, max: 2100 }),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 1, max: 28 }),
        fc.integer({ min: 1, max: 28 }),
        (anio, mes, dia1, dia2) => {
          expect(obtenerEstacion(new Date(anio, mes, dia1))).toBe(
            obtenerEstacion(new Date(anio, mes, dia2))
          );
        }
      ),
      { numRuns: 200 }
    );
  });
});
