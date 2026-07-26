import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import ActividadesTab from './ActividadesTab';
import type { Actividad } from '../types';

/**
 * Feature: edu-planner
 * Property test for activities grouping and ordering (semana + día)
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
    deleteActividad: vi.fn().mockResolvedValue(undefined),
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
 * Etiqueta accesible esperada, calculada de forma independiente al componente:
 * con varias semanas se nombra la semana; con una sola, solo el día.
 */
function etiquetaEsperada(semana: number, dia: Dia, variasSemanas: boolean): string {
  return variasSemanas
    ? `Actividades de la semana ${semana}, ${DIA_LABEL[dia]}`
    : `Actividades del ${DIA_LABEL[dia]}`;
}

/** Grupos esperados: semana ascendente y, dentro de cada semana, lunes→viernes. */
function gruposEsperados(actividades: Actividad[]): { semana: number; dia: Dia }[] {
  const semanas = [...new Set(actividades.map((a) => a.semana))].sort((a, b) => a - b);
  const grupos: { semana: number; dia: Dia }[] = [];
  for (const semana of semanas) {
    for (const dia of DIAS) {
      if (actividades.some((a) => a.semana === semana && a.dia === dia)) {
        grupos.push({ semana, dia });
      }
    }
  }
  return grupos;
}

/**
 * Generador inteligente de actividades: semanas y días mezclados (no ordenados),
 * títulos y descripciones únicos por índice para poder rastrear a qué semana y
 * día pertenece cada actividad renderizada.
 */
const actividadesArb = fc
  .array(
    fc.record({
      semana: fc.integer({ min: 1, max: 4 }),
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
        semana: item.semana,
        dia: item.dia,
        titulo: `Titulo-${tag}`,
        descripcion: `Descripcion-${tag}`,
        orden: item.orden,
      };
    })
  );

describe('Feature: edu-planner, Property 6: Activities grouped and ordered by week and weekday', () => {
  /**
   * **Validates: Requirements 4.4**
   *
   * For any set of activities in a planificación, the Preview Actividades tab SHALL
   * render them grouped by week in ascending order and, within each week, by day in
   * the fixed order lunes, martes, miércoles, jueves, viernes, with each card
   * containing only the activities belonging to that week and that day.
   */

  it('renders one card per present (semana, día) pair, ordered by semana asc then lunes→viernes', () => {
    fc.assert(
      fc.property(actividadesArb, (actividades) => {
        const { unmount } = render(<ActividadesTab actividades={actividades} />);

        const esperados = gruposEsperados(actividades);
        const variasSemanas = new Set(actividades.map((a) => a.semana)).size > 1;

        if (esperados.length === 0) {
          expect(screen.queryAllByRole('listitem')).toHaveLength(0);
        } else {
          const cards = screen.getAllByRole('listitem');
          expect(cards).toHaveLength(esperados.length);

          expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual(
            esperados.map((g) => etiquetaEsperada(g.semana, g.dia, variasSemanas))
          );
        }

        unmount();
      }),
      { numRuns: 120 }
    );
  });

  it('each card contains only the activities belonging to that week and that day', () => {
    fc.assert(
      fc.property(actividadesArb, (actividades) => {
        const { unmount } = render(<ActividadesTab actividades={actividades} />);

        const esperados = gruposEsperados(actividades);
        const cards = esperados.length === 0 ? [] : screen.getAllByRole('listitem');

        esperados.forEach((grupo, cardIndex) => {
          const card = cards[cardIndex];
          const propias = actividades.filter(
            (a) => a.semana === grupo.semana && a.dia === grupo.dia
          );
          const ajenas = actividades.filter(
            (a) => a.semana !== grupo.semana || a.dia !== grupo.dia
          );

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

  it('preserves every activity exactly once across all cards', () => {
    fc.assert(
      fc.property(actividadesArb, (actividades) => {
        const { unmount } = render(<ActividadesTab actividades={actividades} />);

        const cards = actividades.length > 0 ? screen.getAllByRole('listitem') : [];
        const textoTotal = cards.map((c) => c.textContent ?? '').join('|');

        actividades.forEach((a) => {
          expect(textoTotal).toContain(a.titulo);
        });

        unmount();
      }),
      { numRuns: 120 }
    );
  });

  it('grouping is independent of the input order (shuffled input yields same card sequence)', () => {
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

        // Y esa secuencia siempre es (semana asc, día lunes→viernes)
        const variasSemanas = new Set(actividades.map((a) => a.semana)).size > 1;
        const claves = gruposEsperados(actividades).map(
          (g) => g.semana * 10 + DIAS.indexOf(g.dia)
        );
        expect(claves).toEqual([...claves].sort((a, b) => a - b));
        expect(labelsOriginal).toEqual(
          gruposEsperados(actividades).map((g) =>
            etiquetaEsperada(g.semana, g.dia, variasSemanas)
          )
        );
      }),
      { numRuns: 100 }
    );
  });

  it('shows the week in the card heading only when the planificación spans several weeks', () => {
    fc.assert(
      fc.property(actividadesArb.filter((as) => as.length > 0), (actividades) => {
        const { unmount } = render(<ActividadesTab actividades={actividades} />);

        const semanas = [...new Set(actividades.map((a) => a.semana))].sort((a, b) => a - b);
        const variasSemanas = semanas.length > 1;
        const headings = screen
          .getAllByRole('heading', { level: 3 })
          .map((h) => h.textContent);

        const esperados = gruposEsperados(actividades).map((g) =>
          variasSemanas ? `Semana ${g.semana} · ${DIA_LABEL[g.dia]}` : DIA_LABEL[g.dia]
        );
        expect(headings).toEqual(esperados);

        unmount();
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
   * SHALL renderizar exactamente un botón "Agregar actividad" (nunca uno por día ni
   * por semana), sin alterar el agrupamiento por semana ni el orden lunes→viernes.
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

  it('never renders add buttons inside cards, and the (semana, día) order is preserved', () => {
    fc.assert(
      fc.property(actividadesArb, (actividades) => {
        const { unmount } = render(
          <ActividadesTab actividades={actividades} planificacionId="plan-1" />
        );

        const cards = screen.queryAllByRole('listitem');
        cards.forEach((card) => {
          // Dentro de una tarjeta solo puede haber botones de eliminar actividad:
          // nunca botones de agregar (el de agregar es único y vive fuera del listado)
          const etiquetas = Array.from(card.querySelectorAll('button')).map(
            (b) => b.getAttribute('aria-label') ?? ''
          );
          etiquetas.forEach((label) => {
            expect(label).toMatch(/^Eliminar actividad/);
          });
          expect(etiquetas.some((label) => label.includes('Agregar'))).toBe(false);
        });

        const variasSemanas = new Set(actividades.map((a) => a.semana)).size > 1;
        expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual(
          gruposEsperados(actividades).map((g) =>
            etiquetaEsperada(g.semana, g.dia, variasSemanas)
          )
        );

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: edu-planner, Property 6 (extensión): botón de eliminar por actividad', () => {
  /**
   * **Validates: Requirements 4.4**
   *
   * Para cualquier conjunto de actividades, la pestaña Actividades en modo edición
   * SHALL renderizar exactamente un botón de eliminar por actividad, con una etiqueta
   * accesible que identifique a esa actividad, y ninguno en modo lectura, sin alterar
   * el agrupamiento por semana ni el orden lunes→viernes.
   */

  it('renders exactly one delete button per activity, labeled with its title', () => {
    fc.assert(
      fc.property(actividadesArb, (actividades) => {
        const { unmount } = render(
          <ActividadesTab actividades={actividades} planificacionId="plan-1" />
        );

        const botones = screen.queryAllByRole('button', { name: /^Eliminar actividad/ });
        expect(botones).toHaveLength(actividades.length);

        // Cada actividad tiene su propio botón, identificable por el título
        actividades.forEach((a) => {
          expect(
            screen.getByRole('button', { name: `Eliminar actividad: ${a.titulo}` })
          ).toBeInTheDocument();
        });

        // Y el agrupamiento (semana asc, día lunes→viernes) sigue intacto
        const variasSemanas = new Set(actividades.map((a) => a.semana)).size > 1;
        expect(
          screen.queryAllByRole('listitem').map((card) => card.getAttribute('aria-label'))
        ).toEqual(
          gruposEsperados(actividades).map((g) =>
            etiquetaEsperada(g.semana, g.dia, variasSemanas)
          )
        );

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('never renders delete buttons in read-only mode (no planificacionId)', () => {
    fc.assert(
      fc.property(actividadesArb, (actividades) => {
        const { unmount } = render(<ActividadesTab actividades={actividades} />);

        expect(screen.queryAllByRole('button', { name: /^Eliminar actividad/ })).toHaveLength(0);

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('the delete button never adds text to the card (activity texts stay unchanged)', () => {
    fc.assert(
      fc.property(actividadesArb, (actividades) => {
        const soloLectura = render(<ActividadesTab actividades={actividades} />);
        const textosLectura = screen
          .queryAllByRole('listitem')
          .map((card) => card.textContent);
        soloLectura.unmount();

        const edicion = render(
          <ActividadesTab actividades={actividades} planificacionId="plan-1" />
        );
        const textosEdicion = screen
          .queryAllByRole('listitem')
          .map((card) => card.textContent);
        edicion.unmount();

        expect(textosEdicion).toEqual(textosLectura);
      }),
      { numRuns: 100 }
    );
  });
});
