import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceController } from './marketplace.controller';

describe('MarketplaceController', () => {
    let controller: MarketplaceController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MarketplaceController],
        }).compile();

        controller = module.get<MarketplaceController>(MarketplaceController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getCategories', () => {
        it('should return an array of categories', () => {
            const result = [
                { id: '1', name: 'Electronics' },
                { id: '2', name: 'Souvenirs' },
                { id: '3', name: 'Food' },
            ];
            expect(controller.getCategories()).toEqual(result);
        });
    });

    describe('getProducts', () => {
        it('should return an array of products', () => {
            const result = [
                { id: '101', name: 'Wooden Elephant', category: 'Souvenirs', price: 25.0 },
                { id: '102', name: 'Ceylon Tea', category: 'Food', price: 10.0 },
            ];
            expect(controller.getProducts()).toEqual(result);
        });

        it('should log the category if provided', () => {
            const loggerSpy = jest.spyOn(controller['logger'], 'log');
            controller.getProducts('Souvenirs');
            expect(loggerSpy).toHaveBeenCalledWith('Fetching products with category: Souvenirs');
        });
    });

    describe('getProductById', () => {
        it('should return a product by id', () => {
            const id = '101';
            const result = { id, name: 'Sample Product', description: 'Mock description' };
            expect(controller.getProductById(id)).toEqual(result);
        });
    });
});
