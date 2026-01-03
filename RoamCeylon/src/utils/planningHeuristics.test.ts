// src/utils/planningHeuristics.test.ts
import { applyPlanningHeuristics } from './planningHeuristics';
import { TripDestination } from '../types/tripPlanner';

describe('Planning Heuristics Logic', () => {
  
  // Define the Mock Data
  const MOCK_DESTINATIONS: TripDestination[] = [
    {
      id: '1', placeName: 'Kandy Temple', shortDescription: ' Temple', order: 1,
      coordinates: { latitude: 7.2936, longitude: 80.6413 }, // Kandy
      confidenceScore: 0.95,
      metadata: { duration: '2h', category: 'culture' }
    },
    {
      id: '2', placeName: 'Kandy Lake', shortDescription: 'Lake', order: 2,
      coordinates: { latitude: 7.2926, longitude: 80.6423 }, // Very close to ID 1
      confidenceScore: 0.80,
      metadata: { duration: '1h', category: 'relaxation' }
    },
    {
      id: '3', placeName: 'Sigiriya', shortDescription: 'Rock', order: 3,
      coordinates: { latitude: 7.9570, longitude: 80.7603 }, // Far away
      confidenceScore: 0.99,
      metadata: { duration: '4h', category: 'adventure' }
    },
  ];

  it('groups nearby locations and sorts by confidence', () => {
    const results = applyPlanningHeuristics(MOCK_DESTINATIONS);

    // TEST 1: Should have 2 groups (Sigiriya alone, Kandy pair together)
    expect(results.length).toBe(2);

    // TEST 2: Higher confidence group (Sigiriya 0.99) should be first
    expect(results[0][0].placeName).toBe('Sigiriya');
    
    // TEST 3: The second group should contain the Kandy items
    expect(results[1].length).toBe(2);
  });
});