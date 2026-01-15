// --- SELF-CONTAINED TYPES ---
export interface TripDestination {
  id: string;
  order: number;
  placeName: string;
  shortDescription: string;
  coordinates?: { latitude: number; longitude: number };
  metadata: any; // Simplified for safety check
  confidenceScore?: number;
}

/**
 * SAFETY CHECK 1: Input Validation
 */
export const validateInput = (query: string): string | null => {
  if (!query || query.trim().length === 0)
    return 'Please enter a destination or interest.';
  if (query.trim().length < 3)
    return 'Query is too short. Please be more specific.';
  // Basic check for nonsense (only allow letters, numbers, spaces, common punctuation)
  if (/^[^a-zA-Z0-9\s.,!?-]+$/.test(query))
    return 'Please use valid text characters.';
  return null;
};

/**
 * SAFETY CHECK 2: Confidence & Fallback Analysis
 */
export const analyzeResponseQuality = (destinations: TripDestination[]) => {
  if (!destinations || destinations.length === 0) {
    return { status: 'EMPTY', message: 'No matching places found.' };
  }

  // Check if the top result has a very low confidence score (< 0.6)
  const topMatch = destinations[0];
  const isLowConfidence = (topMatch.confidenceScore || 0) < 0.6;

  if (isLowConfidence) {
    return {
      status: 'LOW_CONFIDENCE',
      message:
        "We couldn't find an exact match, but here are some popular alternatives you might like.",
    };
  }

  return { status: 'OK', message: null };
};
