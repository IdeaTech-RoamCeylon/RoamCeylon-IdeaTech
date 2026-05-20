// apps/backend/src/modules/ml/services/retry.service.ts
//
// Generic retry utility with exponential backoff and jitter.
//
// Usage:
//   const result = await this.retryService.withRetry(
//     () => this.prisma.userInterestProfile.findUnique(...),
//     { maxAttempts: 3, baseDelayMs: 100 }
//   );

import { Injectable, Logger } from '@nestjs/common';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default: 3 */
  maxAttempts?: number;
  /** Base delay in ms for exponential backoff. Default: 100 */
  baseDelayMs?: number;
  /** Maximum total delay cap in ms. Default: 5000 */
  maxDelayMs?: number;
  /** Predicate to determine if the error warrants a retry. Default: always retry */
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  /** Label for log messages */
  label?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  /**
   * Execute `fn` and retry on failure with exponential backoff + jitter.
   *
   * Exponential backoff formula:
   *   delay = min(baseDelayMs * 2^(attempt-1) + jitter, maxDelayMs)
   *   jitter = random(0, 50)ms — avoids thundering herd on simultaneous retries
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelayMs = 100,
      maxDelayMs = 5000,
      shouldRetry = () => true,
      label = 'operation',
    } = options;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn();
        if (attempt > 1) {
          this.logger.log(
            `[Retry] ${label} succeeded on attempt ${attempt}/${maxAttempts}`,
          );
        }
        return result;
      } catch (err) {
        lastError = err;

        const isLastAttempt = attempt === maxAttempts;
        const retryable = shouldRetry(err, attempt);

        if (isLastAttempt || !retryable) {
          this.logger.warn(
            `[Retry] ${label} failed after ${attempt} attempt(s). No more retries. ` +
              `Error: ${err instanceof Error ? err.message : String(err)}`,
          );
          break;
        }

        const jitter = Math.floor(Math.random() * 50);
        const delay = Math.min(
          baseDelayMs * Math.pow(2, attempt - 1) + jitter,
          maxDelayMs,
        );

        this.logger.warn(
          `[Retry] ${label} failed on attempt ${attempt}/${maxAttempts}. ` +
            `Retrying in ${delay}ms. Error: ${err instanceof Error ? err.message : String(err)}`,
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
