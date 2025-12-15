import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface Wrapper<T> {
  data: T;
  meta?: Record<string, any>;
}

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  async getCategories(): Promise<Wrapper<Category[]>> {
    const cacheKey = 'marketplace:categories';
    const cached = await this.cacheManager.get<Category[]>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return { data: cached, meta: { count: cached.length } };
    }

    const categories = [
      {
        id: '1',
        name: 'Electronics',
        image: 'https://example.com/electronics.jpg',
      },
      {
        id: '2',
        name: 'Souvenirs',
        image: 'https://example.com/souvenirs.jpg',
      },
      {
        id: '3',
        name: 'Food & Spices',
        image: 'https://example.com/spices.jpg',
      },
      { id: '4', name: 'Clothing', image: 'https://example.com/clothing.jpg' },
    ];

    await this.cacheManager.set(cacheKey, categories);
    this.logger.log(`Cache set for ${cacheKey}`);
    return { data: categories, meta: { count: categories.length } };
  }

  async getProducts(category?: string, sortBy?: string): Promise<Wrapper<Product[]>> {
    const cacheKey = category
      ? `marketplace:products:cat:${category}`
      : 'marketplace:products:all';
    const cached = await this.cacheManager.get<Product[]>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return { data: cached, meta: { count: cached.length } };
    }

    const allProducts = [
      {
        id: '101',
        name: 'Hand-carved Wooden Elephant',
        category: 'Souvenirs',
        price: 4500.0,
        description: 'Traditional Sri Lankan wooden elephant carving.',
        image: 'https://example.com/elephant.jpg',
      },
      {
        id: '102',
        name: 'Pure Ceylon Tea (BOPF)',
        category: 'Food & Spices',
        price: 1200.0,
        description: 'Premium Ceylon black tea, 500g pack.',
        image: 'https://example.com/tea.jpg',
      },
      {
        id: '103',
        name: 'Cinnamon Sticks (Alba)',
        category: 'Food & Spices',
        price: 850.0,
        description: 'High-quality Ceylon Cinnamon sticks.',
        image: 'https://example.com/cinnamon.jpg',
      },
      {
        id: '104',
        name: 'Batik Sarong',
        category: 'Clothing',
        price: 2500.0,
        description: 'Traditional handmade Batik sarong.',
        image: 'https://example.com/sarong.jpg',
      },
    ];

    let result = allProducts;
    if (category) {
      result = allProducts.filter((p) => p.category === category);
    }

    if (sortBy) {
      if (sortBy === 'price') {
        result.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'name') {
        result.sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    await this.cacheManager.set(cacheKey, result);
    this.logger.log(`Cache set for ${cacheKey}`);
    return { data: result, meta: { count: result.length } };
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const response = await this.getProducts();
    return response.data.find((p) => p.id === id);
  }
}
