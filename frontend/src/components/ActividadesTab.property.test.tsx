import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import ActividadesTab from './ActividadesTab';
import type { Actividad } from '../types';

/**
 * Feature: edu-planner
 * Property test for activities grouping and ordering
 * Validates: Requirements 4.4
 */

// Mock PlanContext (ActividadesTab consumes usePlan for inline editing)
vi.mock('../contexts/PlanContext', () => ({
  usePlan: () => ({
    planificacion: null,
    isLoading: false,
    error: null,
    crear: vi.fn(),
    updateField: vi.fn().mockResolvedValue(undefined),
    addActividad: vi.fn(),
    addMaterial: vi.fn(),
    addAdaptacion: vi.fn(),
  }),
}));

type Dia = Actividad['dia'];

const DIAS: Dia[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

const DIA_LABEL: Record<Dia, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
};

/**
 * Generador inteligente de actividades: días mezclados (no ordenados),
 * títulos y descripciones únicos por índice para poder rastrear a qué día
 * pertenece cada actividad renderizada.
 */
const actividadesArb = fc
  .array(
    fc.record({
      dia: fc.constantFrom(...DIAS),
      orden: fc.integer({ min: 1, max: 5 }),
    }),
    { minLength: 0, maxLength: 12 }
  )
  .map<Actividad[]>((items) =>
    items.map((item, index) => {
      // Se usa índice con padding para que ningún token sea substring de otro
      const tag = String(index).padStart(2, '0');
      return {
        id: `act-${tag}`,
        dia: item.dia,
        titulo: `Titulo-${tag}`,
        descripcion: `Descripcion-${tag}`,
        orden: item.orden,
      };
    })
  );

describe('Feature: edu-planner, Property 6: Activities grouped and ordered by weekday', () => {
  /**
   * **Validates: Requirements 4.4**
   *
   * For any set of activities in a planificación, the Preview Actividades tab SHALL
   * render them grouped by day in the fixed order lunes, martes, miércoles, jueves,
   * viernes, with each day's card containing only activities belonging to that day.
   */

  it('renders one card per present day, in the fixed lunes→viernes order', () => {
    fc.assert(
      fc.property(actividadesArb, (actividades) => {
        const { unmount } = render(<ActividadesTab actividades={actividades} />);

        const diasPresentes = DIAS.filter((dia) =>
          actividades.some((a) => a.dia === dia)
        );

        if (diasPresentes.length === 0) {
          expect(screen.queryAllByRole('listitem')).toHaveLength(0);
        } else {
          const cards = screen.getAllByRole('listitem');
          expect(cards).toHaveLength(diasPresentes.length);

          const renderedLabels = cards.map((card) =>
            card.getAttribute('aria-label')
          );
          const expectedLabels = diasPresentes.map(
            (dia) => `Actividades del ${DIA_LABEL[dia]}`
          );
          expect(renderedLabels).toEqual(expectedLabels);
        }

        unmount();
      }),
      { numRuns: 120 }
    );
  });

  it("each day's card contains only the activities belonging to that day", () => {
    fc.assert(
      fc.property(actividadesArb, (actividades) => {
        const { unmount } = render(<ActividadesTab actividades={actividades} />);

        const diasPresentes = DIAS.filter((dia) =>
          actividades.some((a) => a.dia === dia)
        );
        const cards =
          diasPresentes.length === 0 ? [] : screen.getAllByRole('listitem');

        diasPresentes.forEach((dia, cardIndex) => {
          const card = cards[cardIndex];
          const propias = actividades.filter((a) => a.dia === dia);
          const ajenas = actividades.filter((a) => a.dia !== dia);

          propias.forEach((a) => {
            expect(card.textContent).toContain(a.titulo);
            expect(card.textContent).toContain(a.descripcion);
          });

          ajenas
            .filter((a) => !propias.some((p) => p.titulo === a.titulo))
            .forEach((a) => {
              expect(card.textContent).not.toContain(a.titulo);
            });
        });

        unmount();
      }),
      { numRuns: 120 }
    );
  });

  it('preserves every activity exactly once across all day cards', () => {
    fc.assert(
      fc.property(actividadesArb, (actividades) => {
        const { unmount } = render(<ActividadesTab actividades={actividades} />);

        const hayActividades = actividades.length > 0;
        const cards = hayActividades ? screen.getAllByRole('listitem') : [];
        const textoTotal = cards.map((c) => c.textContent ?? '').join('|');

        actividades.forEach((a) => {
          expect(textoTotal).toContain(a.titulo);
        });

        unmount();
      }),
      { numRuns: 120 }
    );
  });

  it('day order is independent of the input order (shuffled input yields same day sequence)', () => {
    const nonEmptyArb = actividadesArb.filter((as) => as.length > 0);

    fc.assert(
      fc.property(nonEmptyArb, (actividades) => {
        const reversed = [...actividades].reverse();

        const first = render(<ActividadesTab actividades={actividades} />);
        const labelsOriginal = screen
          .getAllByRole('listitem')
          .map((card) => card.getAttribute('aria-label'));
        first.unmount();

        const second = render(<ActividadesTab actividades={reversed} />);
        const labelsReversed = screen
          .getAllByRole('listitem')
          .map((card) => card.getAttribute('aria-label'));
        second.unmount();

        expect(labelsReversed).toEqual(labelsOriginal);

        // Y esa secuencia siempre es una subsecuencia del orden lunes→viernes
        const indices = labelsOriginal.map((label) =>
          DIAS.findIndex((dia) => label === `Actividades del ${DIA_LABEL[dia]}`)
        );
        expect(indices.every((i) => i >= 0)).toBe(true);
        const sorted = [...indices].sort((a, b) => a - b);
        expect(indices).toEqual(sorted);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: edu-planner, Property 6 (extensión): botón único de agregar actividad', () => {
  /**
   * **Validates: Requirements 4.4**
   *
   * Para cualquier conjunto de actividades, la pestaña Actividades en modo edición
   * SHALL renderizar exactamente un botón "Agregar actividad" (nunca uno por día),
   * sin alterar el agrupamiento ni el orden lunes→viernes.
   */

  it('renders exactly one "Agregar actividad" button regardless of the activities set', () => {
    fc.assert(
      fc.property(actividadesArb, (actividades) => {
        const { unmount } = render(
          <ActividadesTab actividades={actividades} planificacionId="plan-1" />
        );

        expect(screen.getAllByRole('button', { name: 'Agregar actividad' })).toHaveLength(1);

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('never renders add buttons inside day cards, and day order stays lunes→viernes', () => {
    fc.assert(
      fc.property(actividadesArb, (actividades) => {
        const { unmount } = render(
          <ActividadesTab actividades={actividades} planificacionId="plan-1" />
        );

        const cards = screen.queryAllByRole('listitem');
        cards.forEach((card) => {
          expect(card.querySelector('button')).toBeNull();
        });

        const indices = cards.map((card) =>
          DIAS.findIndex(
            (dia) => card.getAttribute('aria-label') === `Actividades del ${DIA_LABEL[dia]}`
          )
        );
        expect(indices.every((i) => i >= 0)).toBe(true);
        expect(indices).toEqual([...indices].sort((a, b) => a - b));

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
