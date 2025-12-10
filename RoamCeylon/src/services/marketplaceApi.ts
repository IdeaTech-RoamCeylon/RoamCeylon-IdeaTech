import apiService from './api';

// Types for marketplace API responses
export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
}

// Marketplace API endpoints
class MarketplaceApi {
  /**
   * Fetch all marketplace categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const categories = await apiService.get<Category[]>('/marketplace/categories');
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Fetch products, optionally filtered by category
   * @param category - Optional category filter
   */
  async getProducts(category?: string): Promise<Product[]> {
    try {
      const params = category ? { category } : {};
      const products = await apiService.get<Product[]>('/marketplace/products', { params });
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }
}

export const marketplaceApi = new MarketplaceApi();
export default marketplaceApi;
