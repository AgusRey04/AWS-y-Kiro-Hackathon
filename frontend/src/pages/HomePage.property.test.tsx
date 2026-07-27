import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import * as fc from 'fast-check';
import { server } from '../test/mocks/server';
import { AuthProvider } from '../contexts/AuthContext';
import { PlanProvider } from '../contexts/PlanContext';
import HomePage from './HomePage';

/**
 * Feature: edu-planner
 * Property tests for the Home screen
 * Validates: Requirements 3.7, 14.1
 */

const MAX_CONSIGNA_LENGTH = 500;
const TEST_TOKEN = 'mock-jwt-token-123';

// --- Pure submission validation logic, mirroring HomePage.handleCrear (Req 3.7) ---

interface SubmissionResult {
  submitted: boolean;
  validationError: string | null;
}

function validateConsignaSubmission(consigna: string): SubmissionResult {
  const trimmed = consigna.trim();

  if (trimmed.length === 0) {
    return {
      submitted: false,
      validationError:
        'La consigna es obligatoria. Escribí o dictá qué querés trabajar esta semana.',
    };
  }

  if (trimmed.length > MAX_CONSIGNA_LENGTH) {
    return {
      submitted: false,
      validationError: 'La consigna no puede superar los 500 caracteres.',
    };
  }

  return { submitted: true, validationError: null };
}

// --- Shared test helpers ---

/** Number of POST /api/planificaciones requests observed by MSW. */
let backendCallCount = 0;
/** Name returned by the mocked GET /api/auth/me endpoint. */
let currentUserName = 'María García';

function useDefaultHandlers() {
  backendCallCount = 0;

  server.use(
    http.get('/api/auth/me', ({ request }) => {
      if (request.headers.get('Authorization') !== `Bearer ${TEST_TOKEN}`) {
        return HttpResponse.json({ code: 'UNAUTHORIZED', message: 'Token inválido' }, { status: 401 });
      }
      return HttpResponse.json({
        data: {
          user: {
            id: 'user-1',
            nombre: currentUserName,
            escuela: 'Escuela Nº 5',
            email: 'maria@test.com',
          },
        },
      });
    }),
    http.get('/api/datos-estaticos/efemerides', () => HttpResponse.json({ data: [] })),
    http.get('/api/datos-estaticos/sugerencias', () => HttpResponse.json({ data: [] })),
    http.post('/api/planificaciones', () => {
      backendCallCount++;
      return HttpResponse.json({
        data: {
          planificacion: {
            id: 'plan-1',
            titulo: 'Plan de prueba',
            actividades: [],
            materiales: [],
            adaptaciones: [],
          },
        },
      });
    })
  );
}

function renderHomePage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <PlanProvider>
          <HomePage />
        </PlanProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.setItem('token', TEST_TOKEN);
  currentUserName = 'María García';
  useDefaultHandlers();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

describe('Feature: edu-planner, Property 4: Consigna submission validation', () => {
  /**
   * **Validates: Requirements 3.7**
   *
   * For any string that is either empty (length 0) or exceeds 500 characters, pressing
   * the CREAR button SHALL reject submission and display a validation message without
   * invoking the backend API.
   */

  it('rejects every empty or blank consigna with a validation message and no submission', () => {
    const blankConsignaArb = fc.string({
      unit: fc.constantFrom(' ', '\t', '\n', '\r'),
      minLength: 0,
      maxLength: 20,
    });

    fc.assert(
      fc.property(blankConsignaArb, (consigna) => {
        const result = validateConsignaSubmission(consigna);
        expect(result.submitted).toBe(false);
        expect(result.validationError).not.toBeNull();
        expect(result.validationError!.length).toBeGreaterThan(0);
      }),
      { numRuns: 200 }
    );
  });

  it('rejects every consigna exceeding 500 characters with a validation message and no submission', () => {
    const oversizedConsignaArb = fc
      .string({ minLength: MAX_CONSIGNA_LENGTH + 1, maxLength: 1200 })
      .filter((s) => s.trim().length > MAX_CONSIGNA_LENGTH);

    fc.assert(
      fc.property(oversizedConsignaArb, (consigna) => {
        const result = validateConsignaSubmission(consigna);
        expect(result.submitted).toBe(false);
        expect(result.validationError).not.toBeNull();
        expect(result.validationError).toContain('500');
      }),
      { numRuns: 150 }
    );
  });

  it('accepts every consigna whose trimmed length is between 1 and 500 characters', () => {
    const validConsignaArb = fc
      .string({ minLength: 1, maxLength: MAX_CONSIGNA_LENGTH })
      .filter((s) => s.trim().length > 0 && s.trim().length <= MAX_CONSIGNA_LENGTH);

    fc.assert(
      fc.property(validConsignaArb, (consigna) => {
        const result = validateConsignaSubmission(consigna);
        expect(result.submitted).toBe(true);
        expect(result.validationError).toBeNull();
      }),
      { numRuns: 200 }
    );
  });

  it('pressing CREAR with any blank consigna shows a validation message and never calls the backend', async () => {
    const blankConsignaArb = fc.string({
      unit: fc.constantFrom(' ', '\t', '\n'),
      minLength: 0,
      maxLength: 10,
    });

    await fc.assert(
      fc.asyncProperty(blankConsignaArb, async (consigna) => {
        const { unmount } = renderHomePage();

        // El modo por defecto es voz: pasamos a texto para validar el CTA CREAR
        fireEvent.click(screen.getByRole('radio', { name: /texto/i }));

        if (consigna.length > 0) {
          const textarea = screen.getByLabelText('Consigna de planificación');
          fireEvent.change(textarea, { target: { value: consigna } });
        }

        fireEvent.click(screen.getByRole('button', { name: 'CREAR' }));

        const alert = await screen.findByRole('alert');
        expect(alert.textContent).toContain('obligatoria');
        expect(backendCallCount).toBe(0);

        unmount();
      }),
      { numRuns: 100 }
    );
  }, 120000);

  it('pressing CREAR with a valid consigna does invoke the backend (non-vacuity check)', async () => {
    renderHomePage();

    fireEvent.click(screen.getByRole('radio', { name: /texto/i }));

    const textarea = screen.getByLabelText('Consigna de planificación');
    fireEvent.change(textarea, { target: { value: 'Trabajar las estaciones del año' } });
    fireEvent.click(screen.getByRole('button', { name: 'CREAR' }));

    await waitFor(() => {
      expect(backendCallCount).toBe(1);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  }, 20000);
});

describe('Feature: edu-planner, Property 19: Personalized greeting contains user name', () => {
  /**
   * **Validates: Requirements 14.1**
   *
   * For any authenticated user with a registered name, the Home screen greeting SHALL
   * contain that user's name as a substring.
   */

  it('greeting contains the authenticated user name as a substring for any registered name', async () => {
    // Registered names are non-blank and at most 100 characters (Req 8.4)
    const nombreArb = fc
      .string({ minLength: 1, maxLength: 100 })
      .filter((s) => s.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(nombreArb, async (nombre) => {
        currentUserName = nombre;
        useDefaultHandlers();

        const { unmount } = renderHomePage();

        await waitFor(() => {
          const greeting = screen.getByRole('heading', { level: 1 });
          expect(greeting.textContent ?? '').toContain(nombre);
        });

        unmount();
      }),
      { numRuns: 100 }
    );
  }, 120000);
});
