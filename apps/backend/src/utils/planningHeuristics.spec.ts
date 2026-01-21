import {
  distributeActivitiesAcrossDays,
  TripDestination,
} from './planningHeuristics';

describe('Multi-Day Planning Algorithm', () => {
  const MOCK_DATA: TripDestination[] = [
    {
      id: '1',
      placeName: 'Main Temple',
      shortDescription: '',
      order: 0,
      coordinates: { latitude: 7.29, longitude: 80.64 },
      confidenceScore: 0.99,
      metadata: { duration: '3 hours', category: 'culture' },
    },
    {
      id: '2',
      placeName: 'Nearby Lake',
      shortDescription: '',
      order: 0,
      coordinates: { latitude: 7.292, longitude: 80.642 },
      confidenceScore: 0.8,
      metadata: { duration: '2 hours', category: 'relaxation' },
    },
    {
      id: '3',
      placeName: 'Far Away Fort',
      shortDescription: '',
      order: 0,
      coordinates: { latitude: 8.0, longitude: 81.0 },
      confidenceScore: 0.95,
      metadata: { duration: '4 hours', category: 'culture' },
    },
    {
      id: 'TRASH', // <--- Re-added this so we can test filtering
      placeName: 'Trash Place',
      shortDescription: '',
      order: 0,
      coordinates: { latitude: 7.29, longitude: 80.64 },
      confidenceScore: 0.1, // Low score (< 0.4)
      metadata: { duration: '1 hour', category: 'relaxation' },
    },
  ];

  it('balances days AND filters out low-confidence items (Noise Reduction)', () => {
    // Plan for 2 Days
    const plan = distributeActivitiesAcrossDays(MOCK_DATA, 2);

    // 1. Define allPlaces (This fixes the red underline)
    const allPlaces = plan.flat().map((p) => p.placeName);

    // 2. DAY 1 CHECK:
    expect(plan[0][0].placeName).toBe('Main Temple');
    expect(plan[0][1].placeName).toBe('Nearby Lake');
    expect(plan[0].length).toBe(2);

    // 3. CRITICAL: Verify "Trash Place" was filtered out
    expect(allPlaces).not.toContain('Trash Place');
  });
});
