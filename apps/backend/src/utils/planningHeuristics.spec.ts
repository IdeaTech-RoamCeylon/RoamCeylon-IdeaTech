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
      {
        likedCategories: ['food'],
        previouslyVisitedIds: [],
      },
    );
    expect(foodiePlan[0][0].placeName).toBe('Street Food Market');
  });

  it('correctly tags the "Why" (Reasoning Check)', () => {
    const foodiePlan = distributeActivitiesAcrossDays(
      MOCK_PERSONALIZATION_DATA,
      1,
      {
        likedCategories: ['food'],
        previouslyVisitedIds: [],
      },
    );
    expect(foodiePlan[0][0].selectionReason).toBe('preference');
  });

  // --- NEW TEST FOR SPRINT 7: SAFEGUARD ---
  it('applies a soft penalty to dislikes (The Safeguard Test)', () => {
    const mixedBag: TripDestination[] = [
      {
        id: 'bad-shop',
        placeName: 'Mediocre Mall',
        order: 0,
        shortDescription: '',
        coordinates: { latitude: 0, longitude: 0 },
        confidenceScore: 0.5, // Decent score
        metadata: { duration: '1h', category: 'shopping' },
      },
      {
        id: 'good-shop',
        placeName: 'World Famous Mall',
        order: 0,
        shortDescription: '',
        coordinates: { latitude: 0, longitude: 0.1 },
        confidenceScore: 0.9, // Excellent score
        metadata: { duration: '1h', category: 'shopping' },
      },
    ];

    // Profile: HATES shopping
    const result = distributeActivitiesAcrossDays(mixedBag, 1, {
      likedCategories: [],
      previouslyVisitedIds: [],
      dislikedCategories: ['shopping'], // <--- DISLIKE
    });

    const placeNames = result.flat().map((p) => p.placeName);

    // 1. Safeguard Check: The "World Famous Mall" should SURVIVE
    // (0.9 - 0.2 = 0.7, which is > 0.4 threshold)
    expect(placeNames).toContain('World Famous Mall');

    // 2. Quality Control: The "Mediocre Mall" should be DROPPED
    // (0.5 - 0.2 = 0.3, which is < 0.4 threshold)
    expect(placeNames).not.toContain('Mediocre Mall');
  });
});
