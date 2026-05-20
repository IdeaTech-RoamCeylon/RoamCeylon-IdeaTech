// apps/backend/src/modules/ml/services/circuit-breaker.service.ts
//
// Three-state circuit breaker to prevent cascade failures:
//
//   CLOSED   → Normal operation. Failures are counted.
//   OPEN     → Too many consecutive failures. All calls are blocked (use fallback).
//              After resetTimeoutMs the state moves to HALF_OPEN.
//   HALF_OPEN → One test call is allowed. If it succeeds → CLOSED, else → OPEN.
//
// Usage:
//   if (this.circuitBreaker.isOpen('ml-prediction')) {
//     return fallbackResult;  // skip ML, go rule-based
//   }
//   try {
//     const result = await this.callMl(...);
//     this.circuitBreaker.recordSuccess('ml-prediction');
//     return result;
//   } catch (err) {
//     this.circuitBreaker.recordFailure('ml-prediction');
//     return fallbackResult;
//   }

import { Injectable, Logger } from '@nestjs/common';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitStatus {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureAt?: string;
  openedAt?: string;
  nextResetAt?: string;
}

interface CircuitEntry {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureAt?: number;
  openedAt?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);

  private readonly FAILURE_THRESHOLD = 5; // open after 5 consecutive failures
  private readonly RESET_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes until HALF_OPEN

  private readonly circuits = new Map<string, CircuitEntry>();

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Returns true if the circuit is OPEN and callers should use a fallback.
   * Automatically transitions OPEN → HALF_OPEN when reset timeout has elapsed.
   */
  isOpen(name: string): boolean {
    const entry = this.getOrCreate(name);

    if (entry.state === 'CLOSED') return false;

    if (entry.state === 'OPEN') {
      if (
        entry.openedAt !== undefined &&
        Date.now() - entry.openedAt >= this.RESET_TIMEOUT_MS
      ) {
        // Transition to HALF_OPEN — allow one test request through
        entry.state = 'HALF_OPEN';
        this.logger.log(
          `[CircuitBreaker] ${name}: OPEN → HALF_OPEN (testing recovery)`,
        );
        return false;
      }
      return true; // still OPEN — block the call
    }

    // HALF_OPEN — let one test call through
    return false;
  }

  /**
   * Record a successful call. Resets failure count and closes the circuit.
   */
  recordSuccess(name: string): void {
    const entry = this.getOrCreate(name);
    const previousState = entry.state;

    entry.failureCount = 0;
    entry.successCount++;
    entry.state = 'CLOSED';

    if (previousState !== 'CLOSED') {
      this.logger.log(
        `[CircuitBreaker] ${name}: ${previousState} → CLOSED (recovered after ${entry.successCount} success)`,
      );
    }
  }

  /**
   * Record a failed call. Opens the circuit when the failure threshold is reached.
   */
  recordFailure(name: string): void {
    const entry = this.getOrCreate(name);

    entry.failureCount++;
    entry.lastFailureAt = Date.now();

    if (entry.state === 'HALF_OPEN') {
      // Test call failed — reopen immediately
      entry.state = 'OPEN';
      entry.openedAt = Date.now();
      this.logger.warn(
        `[CircuitBreaker] ${name}: HALF_OPEN → OPEN (test call failed)`,
      );
      return;
    }

    if (
      entry.state === 'CLOSED' &&
      entry.failureCount >= this.FAILURE_THRESHOLD
    ) {
      entry.state = 'OPEN';
      entry.openedAt = Date.now();
      this.logger.error(
        `[CircuitBreaker] ${name}: CLOSED → OPEN after ${entry.failureCount} consecutive failures. ` +
          `Fallback will be used for ${this.RESET_TIMEOUT_MS / 1000}s.`,
      );
    } else {
      this.logger.warn(
        `[CircuitBreaker] ${name}: failure ${entry.failureCount}/${this.FAILURE_THRESHOLD}`,
      );
    }
  }

  /**
   * Get the full status of a circuit for the health endpoint.
   */
  getState(name: string): CircuitStatus {
    const entry = this.getOrCreate(name);
    const nextResetAt =
      entry.state === 'OPEN' && entry.openedAt !== undefined
        ? new Date(entry.openedAt + this.RESET_TIMEOUT_MS).toISOString()
        : undefined;

    return {
      state: entry.state,
      failureCount: entry.failureCount,
      successCount: entry.successCount,
      lastFailureAt:
        entry.lastFailureAt !== undefined
          ? new Date(entry.lastFailureAt).toISOString()
          : undefined,
      openedAt:
        entry.openedAt !== undefined
          ? new Date(entry.openedAt).toISOString()
          : undefined,
      nextResetAt,
    };
  }

  /**
   * Returns all tracked circuit names and their states.
   */
  getAllStates(): Record<string, CircuitStatus> {
    const result: Record<string, CircuitStatus> = {};
    for (const name of this.circuits.keys()) {
      result[name] = this.getState(name);
    }
    return result;
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private getOrCreate(name: string): CircuitEntry {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, {
        state: 'CLOSED',
        failureCount: 0,
        successCount: 0,
      });
    }
    return this.circuits.get(name)!;
  }
}
