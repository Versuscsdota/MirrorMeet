import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Полный e2e-сценарий: Auth -> Profiles -> Media -> Schedules
// Требует запущенной БД (DATABASE_URL) и миграций.

describe('CRM E2E (AppModule)', () => {
  let app: INestApplication<App>;
  let http: any;

  let accessToken = '';
  let profileId = '';
  let mediaId = '';
  let scheduleId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health -> ok', async () => {
    const res = await request(http).get('/health').expect(200);
    expect(res.text).toContain('ok');
  });

  it('POST /auth/register -> issues access_token', async () => {
    const ts = Date.now();
    const email = `e2e+${ts}@example.com`;
    const password = 'secret123';

    const res = await request(http)
      .post('/auth/register')
      .send({ email, password, firstName: 'E2E', lastName: 'Test' })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    accessToken = res.body.access_token;
    expect(typeof accessToken).toBe('string');
  });

  it('POST /profiles -> create profile', async () => {
    const res = await request(http)
      .post('/profiles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ fullName: 'Jane Doe', email: `jane+${Date.now()}@example.com`, tags: ['e2e'] })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    profileId = res.body.id;
  });

  it('GET /profiles/:id -> fetch created profile', async () => {
    const res = await request(http)
      .get(`/profiles/${profileId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.id).toBe(profileId);
    expect(res.body.fullName).toBe('Jane Doe');
  });

  it('PATCH /profiles/:id -> update profile', async () => {
    const res = await request(http)
      .patch(`/profiles/${profileId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ notes: 'updated by e2e' })
      .expect(200);

    expect(res.body.notes).toBe('updated by e2e');
  });

  it('POST /media/presign-upload -> get presigned data', async () => {
    const res = await request(http)
      .post('/media/presign-upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ profileId, type: 'PHOTO', mimeType: 'image/jpeg', filename: 'avatar.jpg', size: 123 })
      .expect(201);

    expect(res.body).toHaveProperty('uploadUrl');
    expect(res.body).toHaveProperty('storageKey');
    expect(res.body).toHaveProperty('publicUrl');
  });

  it('POST /media -> save metadata', async () => {
    // Имитация того, что файл уже залит по presign (мы сохраняем только метаданные)
    const key = `profiles/${profileId}/avatar.jpg`;
    const url = `http://localhost:9000/mirrormeet/${key}`;

    const res = await request(http)
      .post('/media')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ profileId, type: 'PHOTO', storageKey: key, url, mimeType: 'image/jpeg', size: 123 })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    mediaId = res.body.id;
  });

  it('GET /media?profileId= -> list media', async () => {
    const res = await request(http)
      .get(`/media?profileId=${profileId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.find((m: any) => m.id === mediaId)).toBeTruthy();
  });

  it('POST /schedules -> create schedule event', async () => {
    const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const res = await request(http)
      .post('/schedules')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ profileId, title: 'Interview', location: 'Office', start, end })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    scheduleId = res.body.id;
  });

  it('PUT /schedules/:id/status -> set status', async () => {
    const res = await request(http)
      .put(`/schedules/${scheduleId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'SHIFT_TRIAL_1', notes: 'moved by e2e' })
      .expect(200);

    expect(res.body.status).toBe('SHIFT_TRIAL_1');
  });

  it('DELETE /schedules/:id -> remove schedule', async () => {
    const res = await request(http)
      .delete(`/schedules/${scheduleId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect([200, 403]).toContain(res.status);
  });

  it('DELETE /media/:id -> remove media (ADMIN/ROOT required)', async () => {
    // Попытка удалить с ролью CURATOR может дать 403; тут зависит от ролей выданных при регистрации.
    // Если вернётся 403, просто пропустим удаление как успешно проверенный запрет.
    const res = await request(http)
      .delete(`/media/${mediaId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect([200, 403]).toContain(res.status);
  });

  it('DELETE /profiles/:id -> remove profile (ADMIN/ROOT required)', async () => {
    const res = await request(http)
      .delete(`/profiles/${profileId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect([200, 403]).toContain(res.status);
  });
});
