import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

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
        const body = res.body as unknown[];
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
      });
  });

  it('/marketplace/products (GET)', () => {
    return request(app.getHttpServer())
      .get('/marketplace/products')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body as unknown)).toBe(true);
      });
  });

  it('/marketplace/products/:id (GET)', () => {
    return request(app.getHttpServer())
      .get('/marketplace/products/101')
      .expect(200)
      .expect((res) => {
        expect(res.body as unknown).toHaveProperty('id', '101');
      });
  });
});
