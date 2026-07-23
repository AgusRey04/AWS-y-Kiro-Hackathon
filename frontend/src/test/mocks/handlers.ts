import { http, HttpResponse } from 'msw';

const TEST_USER = {
  id: 'user-1',
  nombre: 'María García',
  escuela: 'Escuela Nº 5',
  email: 'maria@test.com',
};

const TEST_TOKEN = 'mock-jwt-token-123';

export const handlers = [
  // Health check endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  }),

  // Register
  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as {
      nombre: string;
      escuela: string;
      email: string;
      password: string;
    };

    // Simulate conflict
    if (body.email === 'existing@test.com') {
      return HttpResponse.json(
        { code: 'CONFLICT', message: 'El email ya tiene una cuenta asociada' },
        { status: 409 }
      );
    }

    // Simulate validation error
    if (!body.nombre || !body.escuela || !body.email || !body.password) {
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Campos requeridos faltantes', details: { campo: 'Campo requerido' } },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      data: {
        user: { id: 'user-new', nombre: body.nombre, escuela: body.escuela, email: body.email },
        token: TEST_TOKEN,
      },
    });
  }),

  // Login
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email === 'maria@test.com' && body.password === 'password123') {
      return HttpResponse.json({
        data: { user: TEST_USER, token: TEST_TOKEN },
      });
    }

    return HttpResponse.json(
      { code: 'UNAUTHORIZED', message: 'Credenciales inválidas' },
      { status: 401 }
    );
  }),

  // Logout
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ data: { message: 'Sesión cerrada' } });
  }),

  // Get current user
  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader === `Bearer ${TEST_TOKEN}`) {
      return HttpResponse.json({ data: { user: TEST_USER } });
    }
    return HttpResponse.json(
      { code: 'UNAUTHORIZED', message: 'Token inválido' },
      { status: 401 }
    );
  }),
];
