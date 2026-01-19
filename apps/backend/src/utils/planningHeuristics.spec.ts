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
      confidenceScore: 0.99, // Highest Priority (Anchor Day 1)
      metadata: { duration: '3 hours', category: 'culture' },
    },
    {
      id: '2',
      placeName: 'Nearby Lake',
      shortDescription: '',
      order: 0,
      coordinates: { latitude: 7.292, longitude: 80.642 }, // Very close to Temple
      confidenceScore: 0.8,
      metadata: { duration: '2 hours', category: 'relaxation' },
    },
    {
      id: '3',
      placeName: 'Far Away Fort',
      shortDescription: '',
      order: 0,
      coordinates: { latitude: 8.0, longitude: 81.0 }, // Far away
      confidenceScore: 0.95, // High Priority (Anchor Day 2)
      metadata: { duration: '4 hours', category: 'culture' },
    },
    {
      id: '4',
      placeName: 'Giant Hike',
      shortDescription: '',
      order: 0,
      coordinates: { latitude: 7.29, longitude: 80.64 },
      confidenceScore: 0.5,
      metadata: { duration: 'Full Day', category: 'adventure' }, // 8 hours - Should NOT fit in Day 1 if full
    },
  ];

  it('balances days AND filters out low-confidence items (Noise Reduction)', () => {
    // Plan for 2 Days
    const plan = distributeActivitiesAcrossDays(MOCK_DATA, 2);

    // DAY 1 CHECK:
    // Should pick 'Main Temple' (highest score) FIRST.
    // Should pick 'Nearby Lake' SECOND (because it is close).
    // Should NOT pick 'Far Away Fort' (too far) or 'Giant Hike' (too long).
    expect(plan[0][0].placeName).toBe('Main Temple');
    expect(plan[0][1].placeName).toBe('Nearby Lake');
    expect(plan[0].length).toBe(2);

    // 3. CRITICAL: Verify "Trash Place" was deleted
    expect(allPlaces).not.toContain('Trash Place');
  });
});
