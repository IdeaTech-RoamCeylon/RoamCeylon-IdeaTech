import {
  reorderActivity,
  applyDelay,
  addActivityToItinerary,
  generateStateMessage,
  TripPlan,
  TripDestination,
} from './itineraryModifiers';

const mockTrip: TripPlan = {
  tripId: 'trip-001',
  title: 'Geometry Trip',
  destinations: [
    {
      id: 'A',
      order: 1,
      placeName: 'Point A',
      shortDescription: '',
      coordinates: { latitude: 0, longitude: 0 },
      metadata: {
        duration: '1h',
        category: 'culture',
        bestTimeToVisit: 'Morning',
      },
    },
    {
      id: 'C',
      order: 2,
      placeName: 'Point C',
      shortDescription: '',
      coordinates: { latitude: 0, longitude: 20 },
      metadata: {
        duration: '1h',
        category: 'relaxation',
        bestTimeToVisit: 'Evening',
      },
    },
  ],
};

const pointB: TripDestination = {
  id: 'B',
  order: 0,
  placeName: 'Point B',
  shortDescription: '',
  coordinates: { latitude: 0, longitude: 10 },
  metadata: { duration: '1h', category: 'shopping' },
};

describe('Itinerary Modifiers', () => {
  test('Smart Reorder - Warning logic', () => {
    // FIX: Expect 'evening' (lowercase) because the code converts it to lowercase
    const result = reorderActivity(mockTrip, 1, 0);
    expect(result.warnings[0]).toContain('best visited in the evening');
  });

  test('Apply Delay - Drop logic', () => {
    const longTrip = {
      ...mockTrip,
      destinations: [...mockTrip.destinations, pointB],
    };
    const result = applyDelay(longTrip, 180);
    expect(result.updatedPlan.destinations.length).toBe(2);
    expect(result.warnings[0]).toContain('removed Point B');
  });

  test('Intelligent Add - Cheapest Insertion', () => {
    const result = addActivityToItinerary(mockTrip, pointB);
    expect(result.updatedPlan.destinations.length).toBe(3);
    expect(result.updatedPlan.destinations[1].id).toBe('B');
    expect(result.explanation).toContain('stop #2');
  });

  test('Intelligent Add - Time Limit Protection', () => {
    const hugeTask: TripDestination = {
      ...pointB,
      metadata: { ...pointB.metadata, duration: 'Full Day' }, // 8 hours
    };

    // FIX: This should now pass because 'Full Day' is correctly parsed as 8 hours
    const result = addActivityToItinerary(mockTrip, hugeTask);

    expect(result.updatedPlan.destinations.length).toBe(2);
    expect(result.warnings[0]).toContain('exceeds');
  });

  test('State Explainer', () => {
    const msg = generateStateMessage('ADD', 'Added Point B');
    expect(msg).toContain('Adding stop');
  });
});
