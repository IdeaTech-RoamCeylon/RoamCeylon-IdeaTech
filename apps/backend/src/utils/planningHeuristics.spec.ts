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
      id: 'TRASH',
      placeName: 'Trash Place',
      shortDescription: '',
      order: 0,
      coordinates: { latitude: 7.29, longitude: 80.64 },
      confidenceScore: 0.1,
      metadata: { duration: '1 hour', category: 'relaxation' },
    },
  ];

  const MOCK_PERSONALIZATION_DATA: TripDestination[] = [
    {
      id: 'culture-1',
      placeName: 'Ancient Temple',
      order: 0,
      shortDescription: '',
      coordinates: { latitude: 0, longitude: 0 },
      confidenceScore: 0.6,
      metadata: { duration: '2h', category: 'culture' },
    },
    {
      id: 'food-1',
      placeName: 'Street Food Market',
      order: 0,
      shortDescription: '',
      coordinates: { latitude: 0, longitude: 1 },
      confidenceScore: 0.6,
      metadata: { duration: '2h', category: 'food' },
    },
  ];

  it('balances days AND filters out low-confidence items', () => {
    const plan = distributeActivitiesAcrossDays(MOCK_DATA, 2);
    expect(plan[0][0].placeName).toBe('Main Temple');
    expect(plan[0][0].selectionReason).toBe('popular');
  });

  it('prioritizes categories based on user history', () => {
    const foodiePlan = distributeActivitiesAcrossDays(
      MOCK_PERSONALIZATION_DATA,
      1,
      { likedCategories: ['food'], previouslyVisitedIds: [] },
    );
    expect(foodiePlan[0][0].placeName).toBe('Street Food Market');
  });

  it('correctly tags the "Why" (Reasoning Check)', () => {
    const foodiePlan = distributeActivitiesAcrossDays(
      MOCK_PERSONALIZATION_DATA,
      1,
      { likedCategories: ['food'], previouslyVisitedIds: [] },
    );
    expect(foodiePlan[0][0].selectionReason).toBe('preference');
  });

  it('applies a soft penalty to dislikes (The Safeguard Test)', () => {
    const mixedBag: TripDestination[] = [
      {
        id: 'bad-shop',
        placeName: 'Mediocre Mall',
        order: 0,
        shortDescription: '',
        coordinates: { latitude: 0, longitude: 0 },
        confidenceScore: 0.45, // Decent but low (0.45 * 0.8 = 0.36) -> DROPPED
        metadata: { duration: '1h', category: 'shopping' },
      },
      {
        id: 'good-shop',
        placeName: 'World Famous Mall',
        order: 0,
        shortDescription: '',
        coordinates: { latitude: 0, longitude: 0.1 },
        confidenceScore: 0.9, // Excellent score (0.9 * 0.8 = 0.72) -> SURVIVES
        metadata: { duration: '1h', category: 'shopping' },
      },
    ];

    const result = distributeActivitiesAcrossDays(mixedBag, 1, {
      likedCategories: [],
      previouslyVisitedIds: [],
      dislikedCategories: ['shopping'],
    });

    const placeNames = result.flat().map((p) => p.placeName);
    expect(placeNames).toContain('World Famous Mall');
    expect(placeNames).not.toContain('Mediocre Mall');
  });

  // --- SPRINT 8: BALANCE RELEVANCE VS PERSONALIZATION ---
  it('ensures personalization multipliers do not override core quality', () => {
    const balanceData: TripDestination[] = [
      {
        id: 'trash-food',
        placeName: 'Terrible Food Cart',
        order: 0,
        shortDescription: '',
        coordinates: { latitude: 0, longitude: 0 },
        confidenceScore: 0.2, // Terrible quality
        metadata: { duration: '1h', category: 'food' },
      },
      {
        id: 'great-culture',
        placeName: 'Amazing Museum',
        order: 0,
        shortDescription: '',
        coordinates: { latitude: 0, longitude: 0.1 },
        confidenceScore: 0.9, // Great quality
        metadata: { duration: '2h', category: 'culture' },
      },
    ];

    // User LOVES food, but the food place is terrible.
    const plan = distributeActivitiesAcrossDays(balanceData, 1, {
      likedCategories: ['food'],
      previouslyVisitedIds: [],
    });

    const placeNames = plan.flat().map((p) => p.placeName);

    // The Great Culture spot should survive.
    // The Terrible Food spot (0.2 * 1.15 = 0.23) should STILL be dropped. Quality > Personalization.
    expect(placeNames).toContain('Amazing Museum');
    expect(placeNames).not.toContain('Terrible Food Cart');
  });

  // --- SPRINT 8: CONSISTENCY TESTING ---
  it('generates consistent itineraries for the same query multiple times (No Chaos)', () => {
    // FIX: Explicitly tell TypeScript the shape of the array
    const runs: TripDestination[][][] = [];

    // Generate the exact same plan 5 times
    for (let i = 0; i < 5; i++) {
      runs.push(distributeActivitiesAcrossDays(MOCK_DATA, 2));
    }

    const baseRunString = JSON.stringify(runs[0]);

    // Assert all 4 subsequent runs perfectly match the 1st run
    for (let i = 1; i < 5; i++) {
      expect(JSON.stringify(runs[i])).toBe(baseRunString);
    }

    // Assert the anchor place is stable across runs
    expect(runs[0][0][0].placeName).toBe('Main Temple');
  });
});
