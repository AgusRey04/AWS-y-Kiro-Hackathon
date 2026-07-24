import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import EditableBlock from './EditableBlock';
import ActividadesTab from './ActividadesTab';
import MaterialesTab from './MaterialesTab';
import FundamentacionTab from './FundamentacionTab';
import PreviewPage from '../pages/PreviewPage';
import type { Actividad, Adaptacion, Material, Planificacion } from '../types';

/**
 * Feature: edu-planner
 * Property tests for inline editing
 * Validates: Requirements 5.4, 5.6
 */

// --- Mocks compartidos ---

const mockUsePlan = vi.fn();
vi.mock('../contexts/PlanContext', () => ({
  usePlan: () => mockUsePlan(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'plan-1' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('../services/pdf.service', () => ({
  downloadPdf: vi.fn(),
  printPdf: vi.fn(),
}));

// --- Constantes del dominio ---

type BlockType = 'title' | 'description' | 'fundamentacion';

const LIMITES: Record<BlockType, number> = {
  title: 500,
  description: 2000,
  fundamentacion: 2000,
};

const DIAS: Actividad['dia'][] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

const DIA_LABEL: Record<Actividad['dia'], string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
};

const TAB_LABELS = ['Actividades', 'Materiales', 'Adaptaciones', 'Fundamentación'];

// --- Helpers ---

/** Construye un texto determinístico de longitud exacta a partir de un fragmento. */
function textoDeLongitud(fragmento: string, longitud: number): string {
  const base = fragmento.length > 0 ? fragmento : 'x';
  return base.repeat(Math.ceil(longitud / base.length)).slice(0, longitud);
}

/** Entra en modo edición de un bloque editable y devuelve el textarea. */
function entrarEnEdicion(bloque: HTMLElement): HTMLTextAreaElement {
  fireEvent.click(bloque);
  fireEvent.click(within(bloque).getByLabelText('Editar campo'));
  return within(bloque).getByRole('textbox') as HTMLTextAreaElement;
}

/** Busca el contenedor del bloque editable que muestra el texto dado. */
function bloquePorTexto(texto: string): HTMLElement {
  const nodo = screen.getByText(texto);
  const bloque = nodo.closest('[role="button"]');
  if (!bloque) throw new Error(`No se encontró el bloque editable para "${texto}"`);
  return bloque as HTMLElement;
}

/**
 * Firma estructural de la pantalla de preview: pestañas (etiqueta + estado),
 * panel activo, y las tarjetas/secciones con sus etiquetas en orden de aparición.
 * Es independiente del contenido textual editable.
 */
function firmaEstructural(container: HTMLElement) {
  const tabs = Array.from(container.querySelectorAll('[role="tab"]')).map((t) => ({
    label: t.textContent?.trim() ?? '',
    selected: t.getAttribute('aria-selected'),
  }));
  const panelId = container.querySelector('[role="tabpanel"]')?.id ?? null;
  const listas = Array.from(container.querySelectorAll('[role="list"], ul')).map((l) =>
    l.getAttribute('aria-label')
  );
  const items = Array.from(container.querySelectorAll('[role="listitem"], li')).map((el) =>
    el.getAttribute('aria-label')
  );
  const itemCount = container.querySelectorAll('[role="listitem"], li').length;
  return { tabs, panelId, listas, items, itemCount };
}

// --- Generadores ---

const fragmentoArb = fc
  .string({ minLength: 1, maxLength: 12 })
  .map((s) => (s.trim().length > 0 ? s : 'texto'));

const actividadesArb = fc
  .array(
    fc.record({
      dia: fc.constantFrom(...DIAS),
      orden: fc.integer({ min: 1, max: 5 }),
    }),
    { minLength: 1, maxLength: 8 }
  )
  .map<Actividad[]>((items) =>
    items.map((item, index) => {
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

const materialesArb = fc
  .array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 5 })
  .map<Material[]>((ordenes) =>
    ordenes.map((orden, index) => {
      const tag = String(index).padStart(2, '0');
      return { id: `mat-${tag}`, nombre: `Material-${tag}`, icono: '🍂', orden };
    })
  );

const adaptacionesArb = fc
  .array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 4 })
  .map<Adaptacion[]>((ordenes) =>
    ordenes.map((orden, index) => {
      const tag = String(index).padStart(2, '0');
      return {
        id: `ada-${tag}`,
        categoria: 'Visual',
        titulo: `Adaptacion-${tag}`,
        descripcion: `AdaptacionDesc-${tag}`,
        orden,
      };
    })
  );

const planificacionArb: fc.Arbitrary<Planificacion> = fc
  .record({
    actividades: actividadesArb,
    materiales: materialesArb,
    adaptaciones: adaptacionesArb,
  })
  .map((partes) => ({
    id: 'plan-1',
    titulo: 'Explorando el otoño',
    consignaOriginal: 'Trabajemos el otoño',
    fechaInicio: '2025-06-02',
    fechaFin: '2025-06-06',
    objetivos: ['Explorar texturas', 'Reconocer estaciones'],
    areaCurricular: 'Ambiente Natural',
    ambitoExperiencia: 'Construcción de la identidad',
    fundamentacion: 'Marco teórico de la planificación.',
    categoria: 'recientes' as const,
    createdAt: '2025-06-01T00:00:00Z',
    ...partes,
  }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockUsePlan.mockImplementation(() => ({
    planificacion: null,
    isLoading: false,
    error: null,
    crear: vi.fn(),
    loadById: vi.fn(),
    updateField: vi.fn().mockResolvedValue(undefined),
    addActividad: vi.fn(),
    addMaterial: vi.fn(),
    addAdaptacion: vi.fn(),
  }));
});

describe('Feature: edu-planner, Property 7: Structural preservation during inline editing', () => {
  /**
   * **Validates: Requirements 5.4**
   *
   * For any edit operation on any editable block within a planificación, the overall
   * structure (4 tabs, day-based organization, section ordering) SHALL remain unchanged
   * after the edit completes.
   */

  it('la firma estructural del preview es idéntica antes y después de aplicar una edición', () => {
    fc.assert(
      fc.property(
        planificacionArb,
        fc.nat(),
        fragmentoArb,
        (plan, seleccion, fragmento) => {
          const indice = seleccion % plan.actividades.length;
          const editado: Planificacion = {
            ...plan,
            actividades: plan.actividades.map((a, i) =>
              i === indice
                ? { ...a, titulo: fragmento, descripcion: `${fragmento} ampliado` }
                : a
            ),
          };

          mockUsePlan.mockImplementation(() => ({
            planificacion: plan,
            isLoading: false,
            error: null,
            loadById: vi.fn(),
            updateField: vi.fn().mockResolvedValue(undefined),
            addActividad: vi.fn(),
            addMaterial: vi.fn(),
            addAdaptacion: vi.fn(),
          }));
          const antes = render(<PreviewPage />);
          const firmaAntes = firmaEstructural(antes.container);
          antes.unmount();

          mockUsePlan.mockImplementation(() => ({
            planificacion: editado,
            isLoading: false,
            error: null,
            loadById: vi.fn(),
            updateField: vi.fn().mockResolvedValue(undefined),
            addActividad: vi.fn(),
            addMaterial: vi.fn(),
            addAdaptacion: vi.fn(),
          }));
          const despues = render(<PreviewPage />);
          const firmaDespues = firmaEstructural(despues.container);
          despues.unmount();

          expect(firmaDespues).toEqual(firmaAntes);
          // Las 4 pestañas siempre presentes y en orden
          expect(firmaDespues.tabs.map((t) => t.label)).toEqual(TAB_LABELS);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('activar y editar un bloque no altera la organización por días de la pestaña Actividades', () => {
    fc.assert(
      fc.property(planificacionArb, fc.nat(), fragmentoArb, (plan, seleccion, fragmento) => {
        const { container, unmount } = render(
          <ActividadesTab actividades={plan.actividades} planificacionId={plan.id} />
        );

        const etiquetasAntes = Array.from(
          container.querySelectorAll('[role="listitem"]')
        ).map((el) => el.getAttribute('aria-label'));

        const actividad = plan.actividades[seleccion % plan.actividades.length];
        const bloque = bloquePorTexto(actividad.titulo);
        const textarea = entrarEnEdicion(bloque);
        fireEvent.change(textarea, { target: { value: fragmento } });
        fireEvent.blur(textarea);

        const etiquetasDespues = Array.from(
          container.querySelectorAll('[role="listitem"]')
        ).map((el) => el.getAttribute('aria-label'));

        expect(etiquetasDespues).toEqual(etiquetasAntes);

        // El orden de días renderizado es siempre una subsecuencia de lunes→viernes
        const indices = etiquetasDespues.map((label) =>
          DIAS.findIndex((dia) => label === `Actividades del ${DIA_LABEL[dia]}`)
        );
        expect(indices.every((i) => i >= 0)).toBe(true);
        expect(indices).toEqual([...indices].sort((a, b) => a - b));

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('editar un bloque en cualquier pestaña preserva las 4 pestañas y la pestaña activa', () => {
    fc.assert(
      fc.property(planificacionArb, fc.nat(), fragmentoArb, (plan, seleccion, fragmento) => {
        mockUsePlan.mockImplementation(() => ({
          planificacion: plan,
          isLoading: false,
          error: null,
          loadById: vi.fn(),
          updateField: vi.fn().mockResolvedValue(undefined),
          addActividad: vi.fn(),
          addMaterial: vi.fn(),
          addAdaptacion: vi.fn(),
        }));

        const { container, unmount } = render(<PreviewPage />);

        const indiceTab = seleccion % TAB_LABELS.length;
        const etiquetaTab = TAB_LABELS[indiceTab];
        fireEvent.click(screen.getByRole('tab', { name: etiquetaTab }));

        const textoObjetivo =
          etiquetaTab === 'Actividades'
            ? plan.actividades[seleccion % plan.actividades.length].titulo
            : etiquetaTab === 'Materiales'
            ? plan.materiales[seleccion % plan.materiales.length].nombre
            : etiquetaTab === 'Adaptaciones'
            ? plan.adaptaciones[seleccion % plan.adaptaciones.length].titulo
            : plan.fundamentacion;

        const firmaAntes = firmaEstructural(container);

        const bloque = bloquePorTexto(textoObjetivo);
        const textarea = entrarEnEdicion(bloque);
        fireEvent.change(textarea, { target: { value: fragmento } });
        fireEvent.blur(textarea);

        const firmaDespues = firmaEstructural(container);

        expect(firmaDespues.tabs.map((t) => t.label)).toEqual(TAB_LABELS);
        expect(firmaDespues.tabs[indiceTab].selected).toBe('true');
        expect(firmaDespues.panelId).toBe(firmaAntes.panelId);
        expect(firmaDespues.itemCount).toBe(firmaAntes.itemCount);
        expect(firmaDespues.items).toEqual(firmaAntes.items);
        expect(firmaDespues.listas).toEqual(firmaAntes.listas);

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: edu-planner, Property 8: Editable block character limits by type', () => {
  /**
   * **Validates: Requirements 5.6**
   *
   * For any editable block, the system SHALL enforce a maximum of 500 characters for
   * title-type blocks and 2000 characters for description and fundamentación blocks,
   * rejecting or truncating input that exceeds the respective limit.
   */

  const tipoArb = fc.constantFrom<BlockType>('title', 'description', 'fundamentacion');

  it('trunca la entrada al límite del tipo cuando excede el máximo', () => {
    fc.assert(
      fc.property(
        tipoArb,
        fragmentoArb,
        fc.integer({ min: 1, max: 150 }),
        (tipo, fragmento, exceso) => {
          const limite = LIMITES[tipo];
          const texto = textoDeLongitud(fragmento, limite + exceso);

          const { unmount } = render(
            <EditableBlock
              content="Contenido inicial"
              maxLength={limite}
              onSave={vi.fn().mockResolvedValue(undefined)}
              type={tipo}
              fieldPath={`campo.${tipo}`}
              planificacionId="plan-1"
            />
          );

          const textarea = entrarEnEdicion(screen.getByRole('button'));
          fireEvent.change(textarea, { target: { value: texto } });

          expect(textarea.value).toBe(texto.slice(0, limite));
          expect(textarea.value.length).toBe(limite);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('acepta sin modificar cualquier entrada dentro del límite del tipo', () => {
    fc.assert(
      fc.property(tipoArb, fragmentoArb, fc.nat(), (tipo, fragmento, delta) => {
        const limite = LIMITES[tipo];
        const longitud = delta % (limite + 1);
        const texto = textoDeLongitud(fragmento, longitud);

        const { unmount } = render(
          <EditableBlock
            content="Contenido inicial"
            maxLength={limite}
            onSave={vi.fn().mockResolvedValue(undefined)}
            type={tipo}
            fieldPath={`campo.${tipo}`}
            planificacionId="plan-1"
          />
        );

        const textarea = entrarEnEdicion(screen.getByRole('button'));
        fireEvent.change(textarea, { target: { value: texto } });

        expect(textarea.value).toBe(texto);
        expect(textarea.value.length).toBeLessThanOrEqual(limite);

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('el contador muestra los caracteres restantes respecto del límite del tipo', () => {
    fc.assert(
      fc.property(tipoArb, fragmentoArb, fc.nat(), (tipo, fragmento, delta) => {
        const limite = LIMITES[tipo];
        const longitud = delta % (limite + 1);
        const texto = textoDeLongitud(fragmento, longitud);

        const { unmount } = render(
          <EditableBlock
            content="Contenido inicial"
            maxLength={limite}
            onSave={vi.fn().mockResolvedValue(undefined)}
            type={tipo}
            fieldPath={`campo.${tipo}`}
            planificacionId="plan-1"
          />
        );

        const textarea = entrarEnEdicion(screen.getByRole('button'));
        fireEvent.change(textarea, { target: { value: texto } });

        expect(textarea).toHaveAttribute('maxlength', String(limite));
        expect(
          screen.getByText(`${limite - texto.length} caracteres restantes`)
        ).toBeInTheDocument();

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('los bloques de título usan 500 y los de descripción/fundamentación 2000 en el preview', () => {
    fc.assert(
      fc.property(planificacionArb, fc.nat(), (plan, seleccion) => {
        // Títulos y descripciones de actividades
        const actividadesRender = render(
          <ActividadesTab actividades={plan.actividades} planificacionId={plan.id} />
        );
        const actividad = plan.actividades[seleccion % plan.actividades.length];

        const bloqueTitulo = bloquePorTexto(actividad.titulo);
        expect(entrarEnEdicion(bloqueTitulo)).toHaveAttribute('maxlength', '500');

        const bloqueDescripcion = bloquePorTexto(actividad.descripcion);
        expect(entrarEnEdicion(bloqueDescripcion)).toHaveAttribute('maxlength', '2000');
        actividadesRender.unmount();

        // Nombres de materiales (tipo título)
        const materialesRender = render(
          <MaterialesTab materiales={plan.materiales} planificacionId={plan.id} />
        );
        const material = plan.materiales[seleccion % plan.materiales.length];
        expect(entrarEnEdicion(bloquePorTexto(material.nombre))).toHaveAttribute(
          'maxlength',
          '500'
        );
        materialesRender.unmount();

        // Fundamentación
        const fundamentacionRender = render(
          <FundamentacionTab
            fundamentacion={plan.fundamentacion}
            planificacionId={plan.id}
          />
        );
        expect(entrarEnEdicion(bloquePorTexto(plan.fundamentacion))).toHaveAttribute(
          'maxlength',
          '2000'
        );
        fundamentacionRender.unmount();
      }),
      { numRuns: 100 }
    );
  });
});
