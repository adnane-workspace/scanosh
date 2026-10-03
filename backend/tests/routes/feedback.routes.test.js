import http from 'node:http';
import app from '../../src/app.js';

function request(path, { method = 'GET', body } = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);

    server.listen(0, '127.0.0.1', async () => {
      try {
        const { port } = server.address();
        const response = await fetch(`http://127.0.0.1:${port}${path}`, {
          method,
          headers: body ? { 'Content-Type': 'application/json' } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
        const payload = await response.json();
        server.close(() => resolve({ status: response.status, body: payload }));
      } catch (error) {
        server.close(() => reject(error));
      }
    });
  });
}

describe('feedback routes', () => {
  test('GET /api/me/feedback requires auth', async () => {
    const { status, body } = await request('/api/me/feedback');
    expect(status).toBe(401);
    expect(body.code).toBe('AUTH_REQUIRED');
  });

  test('GET /api/me/feedback/stats requires auth', async () => {
    const { status, body } = await request('/api/me/feedback/stats');
    expect(status).toBe(401);
    expect(body.code).toBe('AUTH_REQUIRED');
  });

  test('POST /api/menu/:slug/feedback rejects an invalid rating', async () => {
    const { status, body } = await request('/api/menu/cafe-central/feedback', {
      method: 'POST',
      body: { rating: 9, comment: 'trop' },
    });

    expect(status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});
