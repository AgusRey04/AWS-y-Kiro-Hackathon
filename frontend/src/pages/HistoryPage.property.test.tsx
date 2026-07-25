import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { PlanCard, type PlanificacionSummary } from './HistoryPage';
import { truncarDescripcion, MAX_DESCRIPCION_CARD } from '../utils/history';

/**
 * Feature: edu-planner
 * Property test for history card content completeness
 * Validates: Requirements 7.1
 */

const CATEGORIAS: PlanificacionSummary['categoria'][] = [
  'recientes',
  'efemerides',
  'proyectos',
  'archivado',
];

const CATEGORY_LABELS: Record<string, string> = {
  recientes: 'Reciente',
  efemerides: 'Efeméride',
  proyectos: 'Proyecto',
  archivado: 'Archivado',
};

/** Fecha ISO (YYYY-MM-DD) válida y determinística. */
const fechaIsoArb = fc
  .tuple(
    fc.integer({ min: 2020, max: 2035 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  )
  .map(
    ([anio, mes, dia]) =>
      `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  );

/**
 * Generador inteligente de resúmenes de planificación: descripciones cortas y
 * largas (para ejercitar el truncado), con y sin imagen, con y sin fecha de
 * inicio, y todas las categorías posibles.
 */
const summaryArb: fc.Arbitrary<PlanificacionSummary> = fc.record({
  id: fc.uuid(),
  titulo: fc.string({ minLength: 1, maxLength: 120 }),
  descripcion: fc.string({ minLength: 0, maxLength: 400 }),
  fechaInicio: fc.option(fechaIsoArb, { nil: null }),
  fechaFin: fc.option(fechaIsoArb, { nil: null }),
  categoria: fc.constantFrom(...CATEGORIAS),
  imagenUrl: fc.option(
    fc.webUrl().map((url) => `${url}/imagen.jpg`),
    { nil: null }
  ),
  createdAt: fechaIsoArb.map((fecha) => `${fecha}T10:00:00Z`),
});

function renderCard(plan: PlanificacionSummary) {
  const onVer = vi.fn();
  const onArchivar = vi.fn();
  const utils = render(<PlanCard plan={plan} onVer={onVer} onArchivar={onArchivar} />);
  return { ...utils, onVer, onArchivar };
}

describe('Feature: edu-planner, Property 11: History card content completeness', () => {
  /**
   * **Validates: Requirements 7.1**
   *
   * For any planificación in the history list, its card SHALL display: an image,
   * a date badge, the title, a description truncated to at most 80 characters,
   * category chips, and both action buttons ("Ver" y la acción secundaria).
   */

  it('renders image, date badge, title, description, category chip and both action buttons', () => {
    fc.assert(
      fc.property(summaryArb, (plan) => {
        const { unmount, onVer, onArchivar } = renderCard(plan);

        // Imagen: contenedor siempre presente; <img> cuando hay URL, placeholder si no
        const imagen = screen.getByTestId('plan-card-imagen');
        expect(imagen).toBeInTheDocument();
        if (plan.imagenUrl) {
          const img = screen.getByRole('img');
          expect(img).toHaveAttribute('src', plan.imagenUrl);
        } else {
          expect(imagen.textContent?.length ?? 0).toBeGreaterThan(0);
        }

        // Badge de fecha con contenido no vacío
        const fecha = screen.getByTestId('plan-card-fecha');
        expect((fecha.textContent ?? '').trim().length).toBeGreaterThan(0);

        // Título completo
        expect(screen.getByTestId('plan-card-titulo').textContent).toBe(plan.titulo);

        // Descripción presente
        expect(screen.getByTestId('plan-card-descripcion')).toBeInTheDocument();

        // Chip de categoría con la etiqueta correspondiente
        expect(screen.getByTestId('plan-card-categoria').textContent).toBe(
          CATEGORY_LABELS[plan.categoria]
        );

        // Botones de acción: "Ver" + acción secundaria (Archivar / Desarchivar)
        const verButton = screen.getByRole('button', { name: 'Ver' });
        const accionLabel = plan.categoria === 'archivado' ? 'Desarchivar' : 'Archivar';
        const accionButton = screen.getByRole('button', { name: accionLabel });

        expect(verButton).toBeInTheDocument();
        expect(accionButton).toBeInTheDocument();

        fireEvent.click(verButton);
        fireEvent.click(accionButton);
        expect(onVer).toHaveBeenCalledTimes(1);
        expect(onArchivar).toHaveBeenCalledTimes(1);

        unmount();
      }),
      { numRuns: 120 }
    );
  });

  it('never displays a description longer than 80 characters', () => {
    fc.assert(
      fc.property(summaryArb, (plan) => {
        const { unmount } = renderCard(plan);

        const texto = screen.getByTestId('plan-card-descripcion').textContent ?? '';
        expect(texto.length).toBeLessThanOrEqual(MAX_DESCRIPCION_CARD);
        expect(texto).toBe(truncarDescripcion(plan.descripcion));

        unmount();
      }),
      { numRuns: 120 }
    );
  });

  it('preserves the original description when it fits, and marks it as truncated otherwise', () => {
    fc.assert(
      fc.property(summaryArb, (plan) => {
        const { unmount } = renderCard(plan);

        const original = plan.descripcion.trim();
        const texto = screen.getByTestId('plan-card-descripcion').textContent ?? '';

        if (original.length <= MAX_DESCRIPCION_CARD) {
          expect(texto).toBe(original);
        } else {
          expect(texto.endsWith('...')).toBe(true);
          // El texto visible sigue siendo un prefijo del original (sin el sufijo)
          expect(original.startsWith(texto.slice(0, -3).trimEnd())).toBe(true);
        }

        unmount();
      }),
      { numRuns: 120 }
    );
  });
});
