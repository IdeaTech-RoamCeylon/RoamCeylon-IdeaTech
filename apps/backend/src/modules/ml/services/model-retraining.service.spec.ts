import { Test, TestingModule } from '@nestjs/testing';
import { ModelRetrainingService } from './model-retraining.service';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { EventEmitter } from 'events';

jest.mock('child_process');
jest.mock('fs');

class MockChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  kill = jest.fn();
}

describe('ModelRetrainingService', () => {
  let service: ModelRetrainingService;
  let mockSpawn: jest.Mock;

  beforeEach(async () => {
    mockSpawn = spawn as unknown as jest.Mock;
    mockSpawn.mockReset();

    // Mock fs.existsSync and fs.readFileSync
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('');

    const module: TestingModule = await Test.createTestingModule({
      providers: [ModelRetrainingService],
    }).compile();

    service = module.get<ModelRetrainingService>(ModelRetrainingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with idle state', () => {
    const status = service.getStatus();
    expect(status.state).toBe('idle');
    expect(status.logs).toEqual([]);
  });

  it('should transition through states and succeed in a normal pipeline run', async () => {
    const mockProcesses: MockChildProcess[] = [];

    // Mock three successful command runs (collecting, training, comparing)
    mockSpawn.mockImplementation(() => {
      const proc = new MockChildProcess();
      mockProcesses.push(proc);

      // Delay resolution of close event to simulate async run
      setTimeout(() => {
        proc.emit('close', 0);
      }, 10);

      return proc;
    });

    service.triggerRetraining();

    // Immediately after triggering, state should be 'collecting'
    let status = service.getStatus();
    expect(status.state).toBe('collecting');
    expect(status.startTime).toBeDefined();

    // Wait for the pipeline to finish running all three steps
    await new Promise((resolve) => setTimeout(resolve, 100));

    status = service.getStatus();
    expect(status.state).toBe('success');
    expect(status.endTime).toBeDefined();
    expect(status.elapsedTimeMs).toBeGreaterThanOrEqual(0);
    expect(status.logs).toContain(
      '[Step 1/3] Collecting training data from live database...',
    );
    expect(status.logs).toContain(
      '[Step 2/3] Training Model v2 (HistGradientBoostingClassifier)...',
    );
    expect(status.logs).toContain(
      '[Step 3/3] Evaluating and comparing model versions...',
    );
    expect(status.logs).toContain(
      '[Retraining] Pipeline completed successfully!',
    );
    expect(mockSpawn).toHaveBeenCalledTimes(3);
  });

  it('should fail and log error if any step in the pipeline fails', async () => {
    mockSpawn.mockImplementation(() => {
      const proc = new MockChildProcess();

      // Simulating step 1 failure
      setTimeout(() => {
        proc.emit('close', 1); // Non-zero exit code
      }, 10);

      return proc;
    });

    service.triggerRetraining();

    // Wait for failure
    await new Promise((resolve) => setTimeout(resolve, 50));

    const status = service.getStatus();
    expect(status.state).toBe('failed');
    expect(status.error).toBe('Command failed with exit code 1');
    expect(status.logs).toContain(
      '[ERROR] Retraining failed: Command failed with exit code 1',
    );
    expect(mockSpawn).toHaveBeenCalledTimes(1); // Fails on first command
  });

  it('should support manual cancellation of a running process', async () => {
    const mockProc = new MockChildProcess();
    mockSpawn.mockReturnValue(mockProc);

    service.triggerRetraining();

    const statusBefore = service.getStatus();
    expect(statusBefore.state).toBe('collecting');

    // Manually cancel
    service.cancelRetraining();

    expect(mockProc.kill).toHaveBeenCalledWith('SIGTERM');

    // Wait to let failure handler resolve
    await new Promise((resolve) => setTimeout(resolve, 10));

    const statusAfter = service.getStatus();
    expect(statusAfter.state).toBe('failed');
    expect(statusAfter.error).toContain(
      'Retraining was manually cancelled by the administrator.',
    );
  });

  it('should not allow starting retraining if already in progress', () => {
    mockSpawn.mockImplementation(() => {
      // Just keep running indefinitely for this test
      return new MockChildProcess();
    });

    service.triggerRetraining();

    const status1 = service.getStatus();
    expect(status1.state).toBe('collecting');

    // Attempt to trigger again
    service.triggerRetraining();

    // Spawning should only be called once
    expect(mockSpawn).toHaveBeenCalledTimes(1);
  });
});
