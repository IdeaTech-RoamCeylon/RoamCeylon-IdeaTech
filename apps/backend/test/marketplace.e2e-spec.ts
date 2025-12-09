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
            .expect([
                { id: '1', name: 'Electronics' },
                { id: '2', name: 'Souvenirs' },
                { id: '3', name: 'Food' },
            ]);
    });

    it('/marketplace/products (GET)', () => {
        return request(app.getHttpServer())
            .get('/marketplace/products')
            .expect(200)
            .expect([
                { id: '101', name: 'Wooden Elephant', category: 'Souvenirs', price: 25.0 },
                { id: '102', name: 'Ceylon Tea', category: 'Food', price: 10.0 },
            ]);
    });

    it('/marketplace/products?category=Souvenirs (GET)', () => {
        return request(app.getHttpServer())
            .get('/marketplace/products?category=Souvenirs')
            .expect(200)
            .expect([
                { id: '101', name: 'Wooden Elephant', category: 'Souvenirs', price: 25.0 },
                { id: '102', name: 'Ceylon Tea', category: 'Food', price: 10.0 },
            ]);
    });

    it('/marketplace/products/101 (GET)', () => {
        return request(app.getHttpServer())
            .get('/marketplace/products/101')
            .expect(200)
            .expect({ id: '101', name: 'Sample Product', description: 'Mock description' });
    });
});
