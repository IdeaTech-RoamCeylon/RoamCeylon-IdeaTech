/**
 * Safe Logger Utility
 * Wraps console methods to prevent sensitive data leakage
 */

class SafeLogger {
  private static SENSITIVE_KEYS = ['Authorization', 'token', 'accessToken', 'password', 'otp'];

  /**
   * Recursively sanitizes an object by masking sensitive keys
   */
  private sanitize(data: any): any {
    if (!data) return data;
    if (typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }

    const sanitized: any = { ...data };

    for (const key of Object.keys(sanitized)) {
      if (SafeLogger.SENSITIVE_KEYS.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Log error safely
   */
  error(message: string, error?: any) {
    if (!error) {
      console.error(message);
      return;
    }

    // Deep clone to avoid mutating original error if it's an object we can clone
    // For Error objects, we typically want message/stack + sanitized extras
    let errorData = error;

    if (error && typeof error === 'object') {
       // If it's an Axios error, we want to be very careful with 'config' and 'request'
       if (error.isAxiosError) {
          errorData = {
             message: error.message,
             status: error.response?.status,
             url: error.config?.url,
             method: error.config?.method,
             responseData: this.sanitize(error.response?.data),
             // Do NOT include headers or full config
          };
       } else {
          // Generic object or Error
          errorData = this.sanitize(error);
       }
    }

    console.error(message, errorData);
  }

  log(message: string, data?: any) {
    if (__DEV__) {
      console.log(message, this.sanitize(data));
    }
  }

  warn(message: string, data?: any) {
     console.warn(message, this.sanitize(data));
  }
}

export const logger = new SafeLogger();
