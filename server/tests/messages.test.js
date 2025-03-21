const request = require('supertest');
const app = require('../server');

describe('GET /messages', () => {
  it('should fetch messages', async () => {
    const response = await request(app).get('/messages');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });
});
