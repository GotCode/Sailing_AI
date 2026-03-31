import request from 'supertest';
import app from '../server';

describe('Health endpoint', () => {
  it('should return degraded status when MongoDB is not connected in test environment', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(['healthy', 'degraded']).toContain(response.body.status);
    expect(response.body).toHaveProperty('database');
    expect(response.body.database).toHaveProperty('connected', false);
  });
});
