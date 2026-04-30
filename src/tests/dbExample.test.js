const request = require('supertest');
const app = require('../app');

jest.mock('../db/pool', () => ({
  query: jest.fn(),
}));

const pool = require('../db/pool');

describe('GET /db-example', () => {
  it('DB 조회 성공 시 200과 데이터를 반환한다', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, name: 'test' }]]);

    const res = await request(app).get('/db-example');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('DB 오류 시 500을 반환한다', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB connection failed'));

    const res = await request(app).get('/db-example');

    expect(res.statusCode).toBe(500);
  });
});
