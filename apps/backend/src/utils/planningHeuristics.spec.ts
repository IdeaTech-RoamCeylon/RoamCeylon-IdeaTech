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
      confidenceScore: 0.99, // High Score -> Keep
      metadata: { duration: '3 hours', category: 'culture' },
    },
    {
      id: '2',
      placeName: 'Nearby Lake',
      shortDescription: '',
      order: 0,
      coordinates: { latitude: 7.292, longitude: 80.642 },
      confidenceScore: 0.8, // High Score -> Keep
      metadata: { duration: '2 hours', category: 'relaxation' },
    },
    {
      id: '3',
      placeName: 'Trash Place',
      shortDescription: '',
      order: 0,
      coordinates: { latitude: 7.292, longitude: 80.642 },
      confidenceScore: 0.1, // <--- LOW SCORE (Should be filtered out!)
      metadata: { duration: '1 hour', category: 'relaxation' },
    },
    {
      id: '4',
      placeName: 'Far Away Fort',
      shortDescription: '',
      order: 0,
      coordinates: { latitude: 8.0, longitude: 81.0 },
      confidenceScore: 0.95, // High Score -> Keep
      metadata: { duration: '4 hours', category: 'culture' },
    },
  ];

  it('balances days AND filters out low-confidence items (Noise Reduction)', () => {
    // Plan for 2 Days
    const plan = distributeActivitiesAcrossDays(MOCK_DATA, 2);

    // 1. Flatten the results to see everyone who made the cut
    const allPlaces = plan.flat().map((p) => p.placeName);

    // 2. Verify Good Stuff is there
    expect(allPlaces).toContain('Main Temple');
    expect(allPlaces).toContain('Nearby Lake');
    expect(allPlaces).toContain('Far Away Fort');

    // 3. CRITICAL: Verify "Trash Place" was deleted
    expect(allPlaces).not.toContain('Trash Place');
  });
});
