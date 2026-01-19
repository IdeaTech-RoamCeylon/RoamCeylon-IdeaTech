import {
  validateInput,
  analyzeResponseQuality,
  TripDestination,
} from './responseSafety';

describe('Safety & Fallback Logic', () => {
  // --- TEST GROUP 1: INPUT VALIDATION ---
  describe('validateInput', () => {
    it('catches empty queries', () => {
      const result = validateInput('');
      expect(result).toContain('Please enter a destination');
    });

    it('catches short queries', () => {
      const result = validateInput('Hi');
      expect(result).toContain('too short');
    });

    it('allows valid queries', () => {
      expect(validateInput('Kandy')).toBeNull();
    });
  });

  // --- TEST GROUP 2: RESPONSE QUALITY ---
  describe('analyzeResponseQuality', () => {
    it('detects empty results', () => {
      const result = analyzeResponseQuality([]);
      expect(result.status).toBe('EMPTY');
      expect(result.message).toContain('broader search');
    });

    it('detects weak matches (Confidence < 0.5)', () => {
      const weakData: TripDestination[] = [
        {
          id: '1',
          placeName: 'Weak Spot',
          order: 1,
          shortDescription: '',
          confidenceScore: 0.3, // Low
          metadata: { duration: '1h', category: 'relaxation' },
        },
      ];

      const result = analyzeResponseQuality(weakData);
      expect(result.status).toBe('WEAK_MATCH');
      expect(result.message).toContain('popular nearby places');
    });

    it('detects partial content (Too few results)', () => {
      // High confidence but only 1 item
      const fewData: TripDestination[] = [
        {
          id: '1',
          placeName: 'Good Spot',
          order: 1,
          shortDescription: '',
          confidenceScore: 0.9,
          metadata: { duration: '1h', category: 'relaxation' },
        },
      ];

      const result = analyzeResponseQuality(fewData);
      expect(result.status).toBe('PARTIAL_CONTENT');
      expect(result.message).toContain('add more');
    });
  });
});
