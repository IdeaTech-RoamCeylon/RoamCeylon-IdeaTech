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
  meta?: {
    count?: number;
    timestamp: string;
    cached: boolean;
    [key: string]: any;
  };
}

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger('MarketplaceService');

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private wrapResponse<T>(data: T, cached: boolean = false): Wrapper<T> {
    return {
      data,
      meta: {
        count: Array.isArray(data) ? data.length : undefined,
        timestamp: new Date().toISOString(),
        cached,
      },
    };
  }

  async getCategories(): Promise<Wrapper<Category[]>> {
    const cacheKey = 'marketplace:categories';
    const cached = await this.cacheManager.get<Category[]>(cacheKey);

    if (cached) {
      return this.wrapResponse(cached, true);
    }

    const categories = [
      {
        id: '1',
        name: 'Electronics',
        image:
          'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500',
      },
      {
        id: '2',
        name: 'Souvenirs',
        image:
          'https://images.unsplash.com/photo-1512411516053-125028080a2b?w=500',
      },
      {
        id: '3',
        name: 'Food & Spices',
        image:
          'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=500',
      },
      {
        id: '4',
        name: 'Clothing',
        image:
          'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500',
      },
    ];

    await this.cacheManager.set(cacheKey, categories, 3600000); // 1 hour
    return this.wrapResponse(categories, false);
  }

  async getProducts(
    category?: string,
    sortBy?: string,
  ): Promise<Wrapper<Product[]>> {
    const cacheKey = category
      ? `marketplace:products:cat:${category}`
      : 'marketplace:products:all';

    const cached = await this.cacheManager.get<Product[]>(cacheKey);
    if (cached) {
      return this.wrapResponse(cached, true);
    }

    const allProducts: Product[] = [
      {
        id: '101',
        name: 'Hand-carved Wooden Elephant',
        category: 'Souvenirs',
        price: 4500.0,
        description: 'Traditional Sri Lankan wooden elephant carving.',
        image:
          'https://images.unsplash.com/photo-1582234372722-50d7ccc30eba?w=500',
      },
      {
        id: '102',
        name: 'Pure Ceylon Tea (BOPF)',
        category: 'Food & Spices',
        price: 1200.0,
        description: 'Premium Ceylon black tea, 500g pack.',
        image:
          'https://images.unsplash.com/photo-1576091160550-2173bdd99825?w=500',
      },
      {
        id: '103',
        name: 'Cinnamon Sticks (Alba)',
        category: 'Food & Spices',
        price: 850.0,
        description: 'High-quality Ceylon Cinnamon sticks.',
        image:
          'https://images.unsplash.com/photo-1599940859674-a7fef6342ee0?w=500',
      },
      {
        id: '104',
        name: 'Batik Sarong',
        category: 'Clothing',
        price: 2500.0,
        description: 'Traditional handmade Batik sarong.',
        image:
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
      },
    ];

    let result = [...allProducts];
    if (category) {
      result = allProducts.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase(),
      );
    }

    if (sortBy === 'price') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    await this.cacheManager.set(cacheKey, result, 3600000); // 1 hour
    return this.wrapResponse(result, false);
  }

  async getProductById(id: string): Promise<Wrapper<Product | undefined>> {
    const cacheKey = `marketplace:product:${id}`;
    const cached = await this.cacheManager.get<Product>(cacheKey);

    if (cached) {
      return this.wrapResponse(cached, true);
    }

    // Since it's mock, we fetch all and find
    const { data: all } = await this.getProducts();
    const product = all.find((p) => p.id === id);

    if (product) {
      await this.cacheManager.set(cacheKey, product, 3600000);
    }

    return this.wrapResponse(product, false);
  }
}
