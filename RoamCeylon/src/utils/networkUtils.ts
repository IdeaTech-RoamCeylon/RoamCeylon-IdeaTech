import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * Network utility functions for connectivity detection and retry logic
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, delay: number) => void;
}

/**
 * Check if device is currently connected to the internet
 */
export const isConnected = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};

/**
 * Get current network state
 */
export const getNetworkState = async (): Promise<NetInfoState> => {
  return await NetInfo.fetch();
};

/**
 * Calculate exponential backoff delay
 */
const calculateBackoff = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number => {
  const delay = initialDelay * Math.pow(multiplier, attempt - 1);
  return Math.min(delay, maxDelay);
};

/**
 * Retry a function with exponential backoff
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects after max attempts
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Check network connectivity before attempting
      const connected = await isConnected();
      if (!connected && attempt > 1) {
        throw new Error('No network connection');
      }

      return await fn();
    } catch (error) {
      lastError = error as Error;


      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Calculate delay for next attempt
      const delay = calculateBackoff(attempt, initialDelay, maxDelay, backoffMultiplier);

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt, delay);
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!;
};

/**
 * Queue for storing failed requests to retry when connection is restored
 */
interface QueuedRequest {
  id: string;
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;

  /**
   * Add a request to the queue
   */
  add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substring(7);
      this.queue.push({ id, fn, resolve, reject });
    });
  }

  /**
   * Process all queued requests
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    // Check if we're connected
    const connected = await isConnected();
    if (!connected) {
      this.isProcessing = false;
      return;
    }

    // Process each request
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) continue;

      try {
        const result = await request.fn();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Clear all queued requests
   */
  clear(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Request queue cleared'));
    });
    this.queue = [];
  }

  /**
   * Get current queue size
   */
  size(): number {
    return this.queue.length;
  }
}

// Export singleton instance
export const requestQueue = new RequestQueue();

/**
 * Subscribe to network state changes
 */
export const subscribeToNetworkChanges = (
  callback: (state: NetInfoState) => void
): (() => void) => {
  return NetInfo.addEventListener(callback);
};
