import { http, HttpResponse } from 'msw';

export const handlers = [
  // Health check endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  }),
];
