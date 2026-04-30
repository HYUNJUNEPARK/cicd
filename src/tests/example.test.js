const request = require('supertest');
const app = require('../app');

describe('GET /example', () => {
  it('200 응답과 success 상태를 반환한다', async () => {
    const res = await request(app).get('/example');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Hello from example API!');
    expect(res.body.timestamp).toBeDefined();
  });
});
