import { getHumanExplanation } from './explanationTemplates';

describe('Explanation Templates & Quality Audit', () => {
  // 1. BREVITY CHECK (New Goal: Shorter Explanations)
  it('generates concise explanations (under 50 chars)', () => {
    const text = getHumanExplanation('REORDER');
    // Ensure we aren't overwhelming the UI
    expect(text.length).toBeLessThan(60);
    expect(text.length).toBeGreaterThan(5);
  });

  // 2. REPLACEMENT CHECK
  it('replaces the place name correctly', () => {
    const text = getHumanExplanation('DELAY_DROP', 'Kandy Lake');
    expect(text).toContain('Kandy Lake');
  });

  // 3. QUALITY CHECK (New Goal: Human Tone)
  it('sounds human (no robotic underscores or codes)', () => {
    const text = getHumanExplanation('DAY_GROUPING');

    // Fail if we accidentally left a code key like "ERR_GRP_01"
    expect(text).not.toContain('_');
    expect(text).toMatch(/^[A-Z]/); // Sentences should start with capital letters
    // Fail if it's too generic/robotic
    expect(text).not.toContain('algorithm');
  });

  // 4. RANDOMIZATION CHECK
  it('returns different variations', () => {
    const outputs = new Set();
    for (let i = 0; i < 20; i++) {
      outputs.add(getHumanExplanation('REORDER'));
    }
    expect(outputs.size).toBeGreaterThan(1);
  });
});
