import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

/* eslint-disable @typescript-eslint/no-unsafe-argument */
describe('MarketplaceController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/marketplace/categories (GET)', () => {
    return request(app.getHttpServer())
      .get('/marketplace/categories')
      .expect(200)
      .expect((res) => {
        const body = res.body as { data: unknown[] };
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThan(0);
      });
  });

  it('/marketplace/products (GET)', () => {
    return request(app.getHttpServer())
      .get('/marketplace/products')
      .expect(200)
      .expect((res) => {
        const body = res.body as { data: unknown[] };
        expect(Array.isArray(body.data)).toBe(true);
      });
  });

  it('/marketplace/products/:id (GET)', () => {
    return request(app.getHttpServer())
      .get('/marketplace/products/101')
      .expect(200)
      .expect((res) => {
        // Product By ID returns raw product or wrapped?
        // Service: getProductById -> returns found product directly (unwrapped in response? No, controller returns service result directly).
        // Service: return response.data.find(...) => returns Product object.
        // So this one endpoint returns the object directly, NOT wrapped in data: ... if my previous edit was correct.
        // Let's re-verify service code.
        expect(res.body as unknown).toHaveProperty('id', '101');
      });
  });
});
