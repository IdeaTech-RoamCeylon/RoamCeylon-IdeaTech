import { getHumanExplanation } from './explanationTemplates';

describe('Explanation Templates & Quality Audit', () => {
  // 1. BREVITY CHECK
  it('generates concise explanations (under 60 chars)', () => {
    const text = getHumanExplanation('REORDER');
    expect(text.length).toBeLessThan(60);
    expect(text.length).toBeGreaterThan(5);
  });

  // 2. REPLACEMENT CHECK (Standard)
  it('replaces the place name correctly', () => {
    const text = getHumanExplanation('DELAY_DROP', 'Kandy Lake');
    expect(text).toContain('Kandy Lake');
  });

  // 3. NEW: PREFERENCE CHECK
  it('injects user preferences correctly', () => {
    const text = getHumanExplanation('PREFERENCE_MATCH', 'History');
    // Should produce: "Chosen because you prefer history."
    expect(text).toContain('history');
    expect(text.length).toBeLessThan(60);
  });

  // 4. QUALITY CHECK
  it('sounds human (no robotic underscores or codes)', () => {
    const text = getHumanExplanation('DAY_GROUPING');
    expect(text).not.toContain('_');
    expect(text).toMatch(/^[A-Z]/);
    expect(text).not.toContain('algorithm');
  });

  // 5. RANDOMIZATION CHECK
  it('returns different variations', () => {
    const outputs = new Set();
    for (let i = 0; i < 20; i++) {
      outputs.add(getHumanExplanation('REORDER'));
    }
    expect(outputs.size).toBeGreaterThan(1);
  });
});
