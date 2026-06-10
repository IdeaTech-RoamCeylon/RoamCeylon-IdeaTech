import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';

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

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly prisma: PrismaService,
  ) {}

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
        name: 'Artisan Goods',
        image:
          'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500',
      },
      {
        id: '2',
        name: 'Souvenirs & Gifts',
        image:
          'https://images.unsplash.com/photo-1512411516053-125028080a2b?w=500',
      },
      {
        id: '3',
        name: 'Food & Beverages',
        image:
          'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=500',
      },
      {
        id: '4',
        name: 'Clothing & Apparel',
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

    const shops = await this.prisma.shop.findMany({
      where: {
        status: 'active',
        ...(category && { category }),
      },
    });

    const result: Product[] = shops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      category: shop.category,
      price: 0.0, // Shops don't have a specific item price, defaulting to 0
      description: shop.description || 'No description available.',
      image:
        shop.coverImageUrl ||
        'https://images.unsplash.com/photo-1582234372722-50d7ccc30eba?w=500',
    }));

    if (sortBy === 'name') {
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

    const shop = await this.prisma.shop.findUnique({
      where: { id },
    });

    let product: Product | undefined;
    if (shop) {
      product = {
        id: shop.id,
        name: shop.name,
        category: shop.category,
        price: 0.0,
        description: shop.description || 'No description available.',
        image:
          shop.coverImageUrl ||
          'https://images.unsplash.com/photo-1582234372722-50d7ccc30eba?w=500',
      };
      await this.cacheManager.set(cacheKey, product, 3600000);
    }

    return this.wrapResponse(product, false);
  }
}
