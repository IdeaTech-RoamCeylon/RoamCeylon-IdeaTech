import {
  reorderActivity,
  applyDelay,
  generateStateMessage,
  TripPlan,
} from './itineraryModifiers';

const mockTrip: TripPlan = {
  tripId: 'trip-001',
  title: 'Kandy Adventure',
  destinations: [
    {
      id: '1',
      order: 1,
      placeName: 'Temple',
      shortDescription: 'Sacred',
      metadata: {
        duration: '2h',
        category: 'culture',
        bestTimeToVisit: 'Morning',
      },
    },
    {
      id: '2',
      order: 2,
      placeName: 'Lake',
      shortDescription: 'Walk',
      metadata: {
        duration: '1h',
        category: 'relaxation',
        bestTimeToVisit: 'Evening',
      },
    },
    {
      id: '3',
      order: 3,
      placeName: 'Night Market',
      shortDescription: 'Shop',
      metadata: {
        duration: '2h',
        category: 'shopping',
        bestTimeToVisit: 'Night',
      },
    },
  ],
};

describe('Advanced State Interactions', () => {
  test('Smart Reorder - Warning logic', () => {
    const result = reorderActivity(mockTrip, 2, 0);
    expect(result.warnings[0]).toContain('best visited in the night');
  });

  test('Apply Delay - Drop logic', () => {
    const result = applyDelay(mockTrip, 180);
    expect(result.updatedPlan.destinations.length).toBe(2);
  });

  test('State Explainer', () => {
    const msg = generateStateMessage('REORDER', 'user');
    expect(msg).toContain('Re-sequenced');
  });
});
