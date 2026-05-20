// apps/backend/src/modules/ml/services/background-queue.service.ts
//
// Lightweight in-process background queue — no Redis, no Bull required.
//
// Design:
//   - Tasks are enqueued as typed objects and processed asynchronously via
//     setImmediate() so they never block the HTTP event loop.
//   - A concurrency limiter caps concurrent workers at MAX_CONCURRENT (3).
//   - Each task type maps to a registered handler function.
//   - getQueueStats() exposes pending/active/completed/failed counts for
//     monitoring via the /api/ml/queue/stats endpoint.

import { Injectable, Logger } from '@nestjs/common';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskType = 'feature-update' | 'model-prep' | 'cache-warmup';

export interface QueueTask {
  id: string;
  type: TaskType;
  payload: Record<string, unknown>;
  enqueuedAt: string;
}

export interface QueueStats {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  totalEnqueued: number;
  maxConcurrent: number;
}

type TaskHandler = (payload: Record<string, unknown>) => Promise<void>;

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class BackgroundQueueService {
  private readonly logger = new Logger(BackgroundQueueService.name);

  private readonly MAX_CONCURRENT = 3;
  private readonly MAX_QUEUE_SIZE = 500;

  private readonly queue: QueueTask[] = [];
  private readonly handlers = new Map<TaskType, TaskHandler>();

  private activeCount = 0;
  private completedCount = 0;
  private failedCount = 0;
  private totalEnqueued = 0;

  // ── Registration ────────────────────────────────────────────────────────────

  /**
   * Register a handler function for a task type.
   * Must be called during module initialization before tasks are enqueued.
   */
  registerHandler(type: TaskType, handler: TaskHandler): void {
    this.handlers.set(type, handler);
    this.logger.log(`[Queue] Handler registered for task type: ${type}`);
  }

  // ── Enqueue ─────────────────────────────────────────────────────────────────

  /**
   * Add a task to the background queue and schedule processing.
   * Returns false if the queue is full (backpressure signal).
   */
  enqueue(type: TaskType, payload: Record<string, unknown> = {}): boolean {
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      this.logger.warn(
        `[Queue] Queue full (${this.MAX_QUEUE_SIZE}). Dropping task type=${type}`,
      );
      return false;
    }

    const task: QueueTask = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      payload,
      enqueuedAt: new Date().toISOString(),
    };

    this.queue.push(task);
    this.totalEnqueued++;

    this.logger.debug(
      `[Queue] Enqueued task id=${task.id} type=${type} queueSize=${this.queue.length}`,
    );

    // Schedule processing without blocking the current call stack
    setImmediate(() => this.processNext());

    return true;
  }

  // ── Stats ────────────────────────────────────────────────────────────────────

  getQueueStats(): QueueStats {
    return {
      pending: this.queue.length,
      active: this.activeCount,
      completed: this.completedCount,
      failed: this.failedCount,
      totalEnqueued: this.totalEnqueued,
      maxConcurrent: this.MAX_CONCURRENT,
    };
  }

  // ── Private: processing loop ─────────────────────────────────────────────────

  private processNext(): void {
    if (this.activeCount >= this.MAX_CONCURRENT) {
      this.logger.debug(
        `[Queue] Concurrency limit reached (${this.MAX_CONCURRENT}). Will retry after active task completes.`,
      );
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    const handler = this.handlers.get(task.type);
    if (!handler) {
      this.logger.warn(
        `[Queue] No handler for task type=${task.type}. Skipping.`,
      );
      this.failedCount++;
      setImmediate(() => this.processNext());
      return;
    }

    this.activeCount++;
    this.logger.log(`[Queue] Starting task id=${task.id} type=${task.type}`);

    handler(task.payload)
      .then(() => {
        this.completedCount++;
        this.logger.log(
          `[Queue] Completed task id=${task.id} type=${task.type}`,
        );
      })
      .catch((err: unknown) => {
        this.failedCount++;
        this.logger.error(
          `[Queue] Failed task id=${task.id} type=${task.type}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      })
      .finally(() => {
        this.activeCount--;
        // Process the next task in queue
        setImmediate(() => this.processNext());
      });
  }
}
