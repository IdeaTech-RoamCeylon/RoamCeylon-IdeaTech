import apiService from './api';
import { Category, Product } from '../types';

// Re-export types for backwards compatibility
export type { Category, Product };

// Backend returns wrapped responses like { data: [...] }
interface WrappedResponse<T> {
  data: T;
  meta?: Record<string, any>;
}

// Marketplace API endpoints
class MarketplaceApi {
  /**
   * Fetch all marketplace categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiService.get<WrappedResponse<Category[]> | Category[]>('/marketplace/categories');
      // Handle both wrapped and unwrapped responses
      if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        return response.data;
      }
      return response as Category[];
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
      const response = await apiService.get<WrappedResponse<Product[]> | Product[]>('/marketplace/products', { params });
      // Handle both wrapped and unwrapped responses
      if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        return response.data;
      }
      return response as Product[];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Fetch a single product by ID
   * @param id - Product ID
   */
  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const product = await apiService.get<Product>(`/marketplace/products/${id}`);
      return product;
    } catch (error) {
      console.error(`Error fetching product with id ${id}:`, error);
      throw error;
    }
  }
}

export const marketplaceApi = new MarketplaceApi();
export default marketplaceApi;
