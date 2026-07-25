import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { jsPDF } from 'jspdf';
import { generateFilename, generatePdf } from './pdf.service';
import type { Actividad, Adaptacion, Material, Planificacion } from '../types';

/**
 * Feature: edu-planner
 * Property tests for PDF generation
 * Validates: Requirements 6.1, 6.6
 */

// --- Constantes del dominio ---

const DIAS: Actividad['dia'][] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

const DIA_LABEL: Record<Actividad['dia'], string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
};

const MAX_FILENAME_LENGTH = 100;
const EXTENSION = '.pdf';

// --- Extracción de texto real del PDF generado ---

/** Quita el escapado de PDF strings: \( \) \\ */
function desescapar(valor: string): string {
  return valor.replace(/\\([()\\])/g, '$1');
}

/**
 * Normaliza una línea de texto del PDF: los caracteres de control y los del rango
 * WinAnsi no imprimible (p. ej. el bullet • codificado como 0x95) pasan a espacio,
 * y los espacios consecutivos se colapsan.
 */
function normalizar(texto: string): string {
  return texto
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrae, en orden de escritura, las líneas de texto realmente embebidas en el
 * documento PDF generado (operadores `(...) Tj` del content stream).
 */
function extraerLineas(doc: jsPDF): string[] {
  const raw = doc.output();
  const operadores = raw.match(/\((?:\\[\s\S]|[^\\()])*\)\s*Tj/g) ?? [];
  return operadores
    .map((op) => normalizar(desescapar(op.slice(1, op.lastIndexOf(')')))))
    .filter((linea) => linea.length > 0);
}

/** Texto completo del PDF con las líneas reunificadas (el wrapping usa espacios). */
function textoCompleto(lineas: string[]): string {
  return normalizar(lineas.join(' '));
}

/** Verifica que un texto del dominio aparezca completo en el PDF. */
function contiene(pdfTexto: string, esperado: string): boolean {
  return pdfTexto.includes(normalizar(esperado));
}

// --- Generadores ---

const LETRAS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáéíóúñÁÉÍÓÚÑ0123456789'.split('');

const palabraArb = fc.string({
  minLength: 2,
  maxLength: 8,
  unit: fc.constantFrom(...LETRAS),
});

/** Frase con palabras separadas por un espacio simple (WinAnsi-encodable). */
const fraseArb = (minPalabras: number, maxPalabras: number) =>
  fc
    .array(palabraArb, { minLength: minPalabras, maxLength: maxPalabras })
    .map((palabras) => palabras.join(' '));

const fechaArb = fc
  .date({ min: new Date('2024-01-01'), max: new Date('2026-12-31'), noInvalidDate: true })
  .map((d) => d.toISOString().slice(0, 10));

/**
 * Planificación válida: al menos una actividad por cada día de lunes a viernes,
 * 2-4 objetivos, materiales y adaptaciones no vacíos, fundamentación extensa.
 * Los textos llevan un tag único para poder localizarlos sin ambigüedad.
 */
const planificacionArb: fc.Arbitrary<Planificacion> = fc
  .record({
    titulo: fraseArb(1, 4),
    objetivos: fc.array(fraseArb(2, 6), { minLength: 2, maxLength: 4 }),
    areaCurricular: fraseArb(1, 3),
    ambitoExperiencia: fraseArb(1, 3),
    fundamentacion: fraseArb(20, 60),
    fechaInicio: fechaArb,
    fechaFin: fechaArb,
    extraPorDia: fc.array(fc.integer({ min: 0, max: 2 }), { minLength: 5, maxLength: 5 }),
    actividadTextos: fc.array(fc.tuple(fraseArb(1, 3), fraseArb(3, 10)), {
      minLength: 15,
      maxLength: 15,
    }),
    materiales: fc.array(fraseArb(1, 3), { minLength: 1, maxLength: 5 }),
    adaptaciones: fc.array(fc.tuple(fraseArb(1, 2), fraseArb(1, 3), fraseArb(3, 10)), {
      minLength: 1,
      maxLength: 4,
    }),
  })
  .map((base) => {
    const actividades: Actividad[] = [];
    let cursor = 0;
    DIAS.forEach((dia, indiceDia) => {
      const cantidad = 1 + base.extraPorDia[indiceDia];
      for (let orden = 1; orden <= cantidad; orden++) {
        const [tituloBase, descripcionBase] = base.actividadTextos[cursor];
        const tag = `A${indiceDia}${orden}`;
        actividades.push({
          id: `act-${tag}`,
          dia,
          titulo: `${tag}T ${tituloBase}`,
          descripcion: `${tag}D ${descripcionBase}`,
          orden,
        });
        cursor++;
      }
    });

    const materiales: Material[] = base.materiales.map((nombre, i) => ({
      id: `mat-${i}`,
      nombre: `M${i} ${nombre}`,
      icono: 'x',
      orden: i + 1,
    }));

    const adaptaciones: Adaptacion[] = base.adaptaciones.map(
      ([categoria, titulo, descripcion], i) => ({
        id: `ada-${i}`,
        categoria: `C${i} ${categoria}`,
        titulo: `AD${i} ${titulo}`,
        descripcion: `ADD${i} ${descripcion}`,
        orden: i + 1,
      })
    );

    return {
      id: 'plan-1',
      titulo: `P ${base.titulo}`,
      consignaOriginal: 'consigna de prueba',
      fechaInicio: base.fechaInicio,
      fechaFin: base.fechaFin,
      objetivos: base.objetivos.map((o, i) => `O${i} ${o}`),
      areaCurricular: `AC ${base.areaCurricular}`,
      ambitoExperiencia: `AE ${base.ambitoExperiencia}`,
      fundamentacion: `F ${base.fundamentacion}`,
      categoria: 'recientes' as const,
      actividades,
      materiales,
      adaptaciones,
      createdAt: '2024-03-18T10:00:00Z',
    };
  });

describe('Feature: edu-planner, Property 9: PDF content completeness', () => {
  /**
   * **Validates: Requirements 6.1**
   *
   * For any valid planificación, the generated PDF SHALL contain the title, date range,
   * objectives, area curricular, all activities organized by day (lunes to viernes),
   * all materials, all adaptaciones, and the full fundamentación text.
   */

  it('el PDF contiene título, rango de fechas, objetivos, área curricular, materiales, adaptaciones y fundamentación completa', () => {
    fc.assert(
      fc.property(planificacionArb, (plan) => {
        const pdfTexto = textoCompleto(extraerLineas(generatePdf(plan)));

        expect(contiene(pdfTexto, plan.titulo)).toBe(true);
        expect(contiene(pdfTexto, `${plan.fechaInicio} al ${plan.fechaFin}`)).toBe(true);

        for (const objetivo of plan.objetivos) {
          expect(contiene(pdfTexto, objetivo)).toBe(true);
        }

        expect(
          contiene(pdfTexto, `${plan.areaCurricular} - ${plan.ambitoExperiencia}`)
        ).toBe(true);

        for (const material of plan.materiales) {
          expect(contiene(pdfTexto, material.nombre)).toBe(true);
        }

        for (const adaptacion of plan.adaptaciones) {
          expect(
            contiene(pdfTexto, `${adaptacion.categoria}: ${adaptacion.titulo}`)
          ).toBe(true);
          expect(contiene(pdfTexto, adaptacion.descripcion)).toBe(true);
        }

        expect(contiene(pdfTexto, plan.fundamentacion)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('el PDF contiene todas las actividades agrupadas bajo su día y en orden lunes a viernes', () => {
    fc.assert(
      fc.property(planificacionArb, (plan) => {
        const lineas = extraerLineas(generatePdf(plan));
        const pdfTexto = textoCompleto(lineas);

        // Todas las actividades (título y descripción) están presentes
        for (const actividad of plan.actividades) {
          expect(contiene(pdfTexto, actividad.titulo)).toBe(true);
          expect(contiene(pdfTexto, actividad.descripcion)).toBe(true);
        }

        // Los encabezados de día aparecen una vez y en orden lunes → viernes
        const indicesDia = DIAS.map((dia) => {
          const label = normalizar(DIA_LABEL[dia]);
          const primero = lineas.indexOf(label);
          expect(primero).toBeGreaterThanOrEqual(0);
          expect(lineas.lastIndexOf(label)).toBe(primero);
          return primero;
        });
        expect(indicesDia).toEqual([...indicesDia].sort((a, b) => a - b));

        const indiceMateriales = lineas.indexOf('Materiales');
        expect(indiceMateriales).toBeGreaterThan(indicesDia[DIAS.length - 1]);

        // Cada actividad se ubica dentro del bloque de su día y respeta el campo orden
        DIAS.forEach((dia, i) => {
          const inicioBloque = indicesDia[i];
          const finBloque = i + 1 < DIAS.length ? indicesDia[i + 1] : indiceMateriales;

          const actividadesDelDia = plan.actividades
            .filter((a) => a.dia === dia)
            .sort((a, b) => a.orden - b.orden);

          const posiciones = actividadesDelDia.map((actividad) => {
            const posicion = lineas.findIndex((linea) =>
              linea.startsWith(normalizar(actividad.titulo).slice(0, 12))
            );
            expect(posicion).toBeGreaterThan(inicioBloque);
            expect(posicion).toBeLessThan(finBloque);
            return posicion;
          });

          expect(posiciones).toEqual([...posiciones].sort((a, b) => a - b));
        });
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: edu-planner, Property 10: PDF filename format and length constraint', () => {
  /**
   * **Validates: Requirements 6.6**
   *
   * For any planificación title and start date, the downloaded PDF filename SHALL follow
   * the pattern "[título] - [fecha inicio].pdf" and SHALL be truncated to a maximum of
   * 100 characters total (including extension).
   */

  const tituloArb = fc.oneof(
    fraseArb(0, 6),
    fc.string({ maxLength: 200, unit: fc.constantFrom(...LETRAS, ' ', '-', '.') })
  );

  it('el nombre de archivo siempre termina en .pdf y nunca excede 100 caracteres', () => {
    fc.assert(
      fc.property(tituloArb, fechaArb, (titulo, fechaInicio) => {
        const filename = generateFilename(titulo, fechaInicio);

        expect(filename.endsWith(EXTENSION)).toBe(true);
        expect(filename.length).toBeLessThanOrEqual(MAX_FILENAME_LENGTH);
      }),
      { numRuns: 100 }
    );
  });

  it('el nombre de archivo es el patrón "[título] - [fecha inicio].pdf" truncado al límite', () => {
    fc.assert(
      fc.property(tituloArb, fechaArb, (titulo, fechaInicio) => {
        const patron = `${titulo} - ${fechaInicio}`;
        const maxBase = MAX_FILENAME_LENGTH - EXTENSION.length;
        const filename = generateFilename(titulo, fechaInicio);
        const base = filename.slice(0, filename.length - EXTENSION.length);

        // La base siempre es un prefijo del patrón completo (sin reordenar ni alterar)
        expect(patron.startsWith(base)).toBe(true);

        if (patron.length <= maxBase) {
          // Sin truncamiento: patrón exacto
          expect(filename).toBe(`${patron}${EXTENSION}`);
        } else {
          // Con truncamiento: se conserva el prefijo máximo posible
          expect(base).toBe(patron.slice(0, maxBase));
          expect(filename.length).toBe(MAX_FILENAME_LENGTH);
        }
      }),
      { numRuns: 100 }
    );
  });
});
