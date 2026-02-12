import apiService from './api';
import { Category, Product } from '../types';
import { retryWithBackoff } from '../utils/networkUtils';

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
   * Helper to unwrap backend responses that might be { data: [...] } or [...]
   */
  private unwrap<T>(response: WrappedResponse<T> | T): T {
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as WrappedResponse<T>).data;
    }
    return response as T;
  }

  /**
   * Fetch all marketplace categories
   */
  getCategories = async (): Promise<Category[]> => {
    try {
      return await retryWithBackoff(async () => {
        const response = await apiService.get<WrappedResponse<Category[]> | Category[]>('/marketplace/categories');
        return this.unwrap(response);
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Fetch products, optionally filtered by category with pagination support
   * @param category - Optional category filter
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of items per page
   */
  getProducts = async (
    category?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ data: Product[]; hasMore: boolean; total: number }> => {
    try {
      return await retryWithBackoff(async () => {
        const params: any = { page, pageSize };
        if (category) {
          params.category = category;
        }
        
        const response = await apiService.get<WrappedResponse<Product[]> | Product[]>('/marketplace/products', { params });
        const products = this.unwrap(response);
        
        // Calculate pagination metadata
        // In a real app, this would come from the backend
        const total = products.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = products.slice(startIndex, endIndex);
        const hasMore = endIndex < total;
        
        return {
          data: paginatedData,
          hasMore,
          total,
        };
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Fetch a single product by ID
   * @param id - Product ID
   */
  getProductById = async (id: string): Promise<Product | undefined> => {
    try {
      return await retryWithBackoff(async () => {
        const product = await apiService.get<Product>(`/marketplace/products/${id}`);
        return product;
      });
    } catch (error) {
      console.error(`Error fetching product with id ${id}:`, error);
      throw error;
    }
  }
}

export const marketplaceApi = new MarketplaceApi();
export default marketplaceApi;
