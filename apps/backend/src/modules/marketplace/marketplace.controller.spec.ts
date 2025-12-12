import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { INestApplication } from '@nestjs/common';

describe('MarketplaceController', () => {
  let controller: MarketplaceController;
  let app: INestApplication;

  const mockMarketplaceService = {
    getCategories: jest.fn(() => [
      { id: '1', name: 'Electronics' },
      { id: '2', name: 'Souvenirs' },
      { id: '3', name: 'Food' },
    ]),
    getProducts: jest.fn(() => [
      {
        id: '101',
        name: 'Wooden Elephant',
        category: 'Souvenirs',
        price: 25.0,
      },
      { id: '102', name: 'Ceylon Tea', category: 'Food', price: 10.0 },
    ]),
    getProductById: jest.fn((id: string) => ({
      id,
      name: 'Sample Product',
      description: 'Mock description',
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketplaceController],
      providers: [
        {
          provide: MarketplaceService,
          useValue: mockMarketplaceService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    controller = module.get<MarketplaceController>(MarketplaceController);
  });

  afterEach(async () => {
    await app.close(); // Close the application after each test
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCategories', () => {
    it('should return an array of categories', async () => {
      const result = [
        { id: '1', name: 'Electronics' },
        { id: '2', name: 'Souvenirs' },
        { id: '3', name: 'Food' },
      ];
      expect(await controller.getCategories()).toEqual(result);
    });
  });

  describe('getProducts', () => {
    it('should return an array of products', async () => {
      const result = [
        {
          id: '101',
          name: 'Wooden Elephant',
          category: 'Souvenirs',
          price: 25.0,
        },
        { id: '102', name: 'Ceylon Tea', category: 'Food', price: 10.0 },
      ];
      expect(await controller.getProducts({})).toEqual(result);
    });

    it('should log the category if provided', async () => {
      const loggerSpy = jest.spyOn(controller['logger'], 'log');
      await controller.getProducts({ category: 'Souvenirs' });
      expect(loggerSpy).toHaveBeenCalledWith(
        'Fetching products with category: Souvenirs',
      );
    });
  });

  describe('getProductById', () => {
    it('should return a product by id', async () => {
      const id = '101';
      const result = {
        id,
        name: 'Sample Product',
        description: 'Mock description',
      };
      expect(await controller.getProductById(id)).toEqual(result);
    });
  });
});
