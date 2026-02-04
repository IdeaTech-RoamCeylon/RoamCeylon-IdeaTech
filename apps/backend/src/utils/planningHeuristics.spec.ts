import {
  distributeActivitiesAcrossDays,
  TripDestination,
} from './planningHeuristics';

describe('Multi-Day Planning Algorithm', () => {
  // --- EXISTING TEST DATA ---
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
      id: 'TRASH',
      placeName: 'Trash Place',
      shortDescription: '',
      order: 0,
      coordinates: { latitude: 7.29, longitude: 80.64 },
      confidenceScore: 0.1, // Low score (< 0.4)
      metadata: { duration: '1 hour', category: 'relaxation' },
    },
  ];

  // --- NEW TEST DATA FOR PERSONALIZATION ---
  const MOCK_PERSONALIZATION_DATA: TripDestination[] = [
    {
      id: 'culture-1',
      placeName: 'Ancient Temple',
      order: 0,
      shortDescription: '',
      coordinates: { latitude: 0, longitude: 0 },
      confidenceScore: 0.6, // Moderate baseline
      metadata: { duration: '2h', category: 'culture' },
    },
    {
      id: 'food-1',
      placeName: 'Street Food Market',
      order: 0,
      shortDescription: '',
      coordinates: { latitude: 0, longitude: 1 },
      confidenceScore: 0.6, // Moderate baseline (Same as temple)
      metadata: { duration: '2h', category: 'food' },
    },
  ];

  // --- TEST 1: EXISTING LOGIC ---
  it('balances days AND filters out low-confidence items (Noise Reduction)', () => {
    const plan = distributeActivitiesAcrossDays(MOCK_DATA, 2);
    const allPlaces = plan.flat().map((p) => p.placeName);

    // DAY 1 CHECK:
    expect(plan[0][0].placeName).toBe('Main Temple');
    expect(plan[0][1].placeName).toBe('Nearby Lake');
    expect(plan[0].length).toBe(2);

    // CRITICAL: Verify "Trash Place" was filtered out
    expect(allPlaces).not.toContain('Trash Place');
  });

  // --- TEST 2: NEW PERSONALIZATION LOGIC ---
  it('prioritizes categories based on user history (The "Foodie" vs "Historian" test)', () => {
    // 1. Profile: Loves FOOD
    const foodiePlan = distributeActivitiesAcrossDays(
      MOCK_PERSONALIZATION_DATA,
      1,
      {
        likedCategories: ['food'],
        previouslyVisitedIds: [],
      },
    );

    // Food should be #1 because of the boost (+15%)
    expect(foodiePlan[0][0].placeName).toBe('Street Food Market');

    // 2. Profile: Loves CULTURE
    const historianPlan = distributeActivitiesAcrossDays(
      MOCK_PERSONALIZATION_DATA,
      1,
      {
        likedCategories: ['culture'],
        previouslyVisitedIds: [],
      },
    );

    // Culture should be #1 because of the boost (+15%)
    expect(historianPlan[0][0].placeName).toBe('Ancient Temple');
  });

  // --- TEST 3: EXPLICIT BOOST ---
  it('massively boosts explicitly edited/visited places', () => {
    const hiddenGem: TripDestination = {
      id: 'gem-1',
      placeName: 'Hidden Gem',
      order: 0,
      shortDescription: '',
      coordinates: { latitude: 0, longitude: 0 },
      confidenceScore: 0.3, // LOW SCORE (Normally filtered out < 0.4)
      metadata: { duration: '1h', category: 'relaxation' },
    };

    // Run with History that includes this ID
    const plan = distributeActivitiesAcrossDays([hiddenGem], 1, {
      likedCategories: [],
      previouslyVisitedIds: ['gem-1'], // User manually added this before
    });

    // It should now survive the filter because 0.3 + 0.25 (boost) = 0.55 (> 0.4)
    expect(plan.length).toBeGreaterThan(0);
    expect(plan[0][0].placeName).toBe('Hidden Gem');
  });
});
