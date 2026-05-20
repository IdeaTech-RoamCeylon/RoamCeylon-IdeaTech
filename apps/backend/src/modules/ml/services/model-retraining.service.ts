import { Injectable, Logger } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export type RetrainingState =
  | 'idle'
  | 'collecting'
  | 'training'
  | 'comparing'
  | 'success'
  | 'failed';

export interface RetrainingStatus {
  state: RetrainingState;
  startTime?: string;
  endTime?: string;
  elapsedTimeMs?: number;
  error?: string;
  logs: string[];
  comparisonReport?: Record<string, unknown>;
}

@Injectable()
export class ModelRetrainingService {
  private readonly logger = new Logger(ModelRetrainingService.name);

  private status: RetrainingStatus = {
    state: 'idle',
    logs: [],
  };

  private currentProcess: ChildProcess | null = null;

  getStatus(): RetrainingStatus {
    // If running, dynamically calculate elapsed time
    if (
      this.status.state !== 'idle' &&
      this.status.state !== 'success' &&
      this.status.state !== 'failed' &&
      this.status.startTime
    ) {
      const elapsed = Date.now() - new Date(this.status.startTime).getTime();
      return {
        ...this.status,
        elapsedTimeMs: elapsed,
      };
    }
    return this.status;
  }

  triggerRetraining(): void {
    if (
      this.status.state !== 'idle' &&
      this.status.state !== 'success' &&
      this.status.state !== 'failed'
    ) {
      this.logger.warn('Model retraining already in progress.');
      return;
    }

    this.logger.log('Starting model retraining pipeline...');

    // Reset status
    this.status = {
      state: 'collecting',
      startTime: new Date().toISOString(),
      logs: ['[Retraining] Starting retraining pipeline...'],
    };

    // Run pipeline asynchronously
    this.runPipeline().catch((err: unknown) => {
      const message =
        (err instanceof Error ? err.message : null) ||
        'Unknown error during pipeline execution';
      this.handleFailure(message);
    });
  }

  private async runPipeline(): Promise<void> {
    const backendRoot = path.join(__dirname, '../../../../');

    // Step 1: Collect training data
    this.logger.log('Step 1: Collecting training data...');
    this.status.state = 'collecting';
    this.status.logs.push(
      '[Step 1/3] Collecting training data from live database...',
    );

    await this.executeCommand(
      'npx',
      ['tsx', 'scripts/collect-training-data.ts'],
      backendRoot,
    );

    // Step 2: Retrain model
    this.logger.log('Step 2: Training model v2...');
    this.status.state = 'training';
    this.status.logs.push(
      '[Step 2/3] Training Model v2 (HistGradientBoostingClassifier)...',
    );

    await this.executeCommand(
      'python',
      ['scripts/retrain_model_v2.py'],
      backendRoot,
    );

    // Step 3: Compare model versions
    this.logger.log('Step 3: Comparing model versions...');
    this.status.state = 'comparing';
    this.status.logs.push(
      '[Step 3/3] Evaluating and comparing model versions...',
    );

    await this.executeCommand(
      'npx',
      ['tsx', 'scripts/compare-model-versions.ts'],
      backendRoot,
    );

    // Step 4: Finalize and load comparison report
    this.logger.log('Pipeline complete! Loading comparison report...');
    this.status.state = 'success';
    this.status.endTime = new Date().toISOString();
    if (this.status.startTime) {
      this.status.elapsedTimeMs =
        Date.now() - new Date(this.status.startTime).getTime();
    }
    this.status.logs.push('[Retraining] Pipeline completed successfully!');

    // Read the generated comparison report
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const reportFile = path.join(
        backendRoot,
        `MODEL_COMPARISON_REPORT_${todayStr}.json`,
      );
      if (fs.existsSync(reportFile)) {
        const reportContent = fs.readFileSync(reportFile, 'utf-8');
        this.status.comparisonReport = JSON.parse(reportContent) as Record<
          string,
          unknown
        >;
        this.status.logs.push(
          `[Retraining] Comparison report loaded successfully from ${path.basename(reportFile)}`,
        );
      } else {
        this.status.logs.push(
          '[Retraining] Warning: Comparison report JSON file not found.',
        );
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      this.status.logs.push(
        `[Retraining] Warning: Failed to parse comparison report: ${message}`,
      );
    }

    this.currentProcess = null;
  }

  private executeCommand(
    command: string,
    args: string[],
    cwd: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.status.logs.push(`> Running: ${command} ${args.join(' ')}`);

      const proc = spawn(command, args, {
        cwd,
        env: { ...process.env, PAGER: 'cat' },
      });

      this.currentProcess = proc;

      if (proc.stdout) {
        proc.stdout.on('data', (data: Buffer | string) => {
          const lines = data.toString().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              this.status.logs.push(line.trim());
              // Keep logs clamped to last 500 lines to avoid memory bloating
              if (this.status.logs.length > 500) {
                this.status.logs.shift();
              }
            }
          }
        });
      }

      if (proc.stderr) {
        proc.stderr.on('data', (data: Buffer | string) => {
          const lines = data.toString().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              this.status.logs.push(`[stderr] ${line.trim()}`);
              if (this.status.logs.length > 500) {
                this.status.logs.shift();
              }
            }
          }
        });
      }

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  private handleFailure(errorMsg: string): void {
    this.logger.error(`Retraining pipeline failed: ${errorMsg}`);
    this.status.state = 'failed';
    this.status.endTime = new Date().toISOString();
    if (this.status.startTime) {
      this.status.elapsedTimeMs =
        Date.now() - new Date(this.status.startTime).getTime();
    }
    this.status.error = errorMsg;
    this.status.logs.push(`[ERROR] Retraining failed: ${errorMsg}`);
    this.currentProcess = null;
  }

  // Force cancel if process is running
  cancelRetraining(): void {
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM');
      this.handleFailure(
        'Retraining was manually cancelled by the administrator.',
      );
    }
  }
}
