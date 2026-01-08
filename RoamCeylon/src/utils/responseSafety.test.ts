import { validateInput, analyzeResponseQuality } from './responseSafety';
import { TripDestination } from '../types/tripPlanner';

describe('Safety & Fallback Logic', () => {

  // --- TEST GROUP 1: INPUT VALIDATION ---
  describe('validateInput', () => {
    
    it('catches empty queries', () => {
      const result = validateInput('');
      expect(result).toBe("Please enter a destination.");
    });

    it('catches short queries', () => {
      const result = validateInput('Hi');
      expect(result).toBe("Destination name is too short. Please be specific.");
    });

    it('allows valid queries', () => {
      const result = validateInput('Kandy');
      expect(result).toBeNull(); // Should be null (Safe)
    });
  });

  // --- TEST GROUP 2: RESPONSE QUALITY ---
  describe('analyzeResponseQuality', () => {
    
    it('detects empty results (Fallback)', () => {
      const result = analyzeResponseQuality([]);
      expect(result.status).toBe('EMPTY');
    });

    it('detects low confidence results (Safety Warning)', () => {
      // Mock data representing a "weak" AI match
      const weakData: TripDestination[] = [
        { 
          id: '1', 
          placeName: 'Random Place', 
          order: 1,
          shortDescription: '...', 
          confidenceScore: 0.4, // < 0.6
          metadata: { duration: '1h', category: 'relaxation' }
        }
      ];

      const result = analyzeResponseQuality(weakData);
      expect(result.status).toBe('LOW_CONFIDENCE');
      expect(result.message).toContain("couldn't find an exact match");
    });

    it('approves high quality results', () => {
      const strongData: TripDestination[] = [
        { 
          id: '1', 
          placeName: 'Sigiriya', 
          order: 1, 
          shortDescription: '...', 
          confidenceScore: 0.95, // High Score
          metadata: { duration: '3h', category: 'culture' }
        }
      ];

      const result = analyzeResponseQuality(strongData);
      expect(result.status).toBe('OK');
    });
  });
});