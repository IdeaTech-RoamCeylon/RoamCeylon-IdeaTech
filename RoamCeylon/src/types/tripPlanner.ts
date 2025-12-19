export interface TripPlan {
  tripId: string;
  title: string;
  destinations: TripDestination[];
}

export interface TripDestination {
  id: string;
  order: number;           // Helps maintain the sequence of the trip
  placeName: string;       // Name of the suggested place
  shortDescription: string; // AI generated 1-2 sentence summary
  coordinates?: {          // Optional: Good for your Mapbox integration
    latitude: number;
    longitude: number;
  };
  metadata: DestinationMetadata;
}

export interface DestinationMetadata {
  duration: string;        // e.g., "2 hours", "Half day"
  category: 'adventure' | 'relaxation' | 'culture' | 'shopping' | 'food';
  bestTimeToVisit?: string;
  estimatedCost?: string;
}