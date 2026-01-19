import { getHumanExplanation } from './explanationTemplates';

describe('Explanation Templates', () => {
  it('returns a string for REORDER', () => {
    const text = getHumanExplanation('REORDER');
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(5);
  });

  it('replaces the place name correctly', () => {
    const text = getHumanExplanation('DELAY_DROP', 'Kandy Lake');
    // The template might say "Removed Kandy Lake..." or "Skipped Kandy Lake..."
    // We check if "Kandy Lake" exists inside the result string.
    expect(text).toContain('Kandy Lake');
  });

  it('returns different variations (Randomization Check)', () => {
    // This test *might* fail purely by chance if random picks the same one twice,
    // but running it multiple times usually shows variation.
    const outputs = new Set();
    for (let i = 0; i < 20; i++) {
      outputs.add(getHumanExplanation('REORDER'));
    }
    // We expect at least 2 different unique messages out of 20 tries
    expect(outputs.size).toBeGreaterThan(1);
  });
});
