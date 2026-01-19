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
    return { 
      status: 'EMPTY', 
      message: 'No places found. Try a broader search like "Beaches" or "Kandy".' 
    };
  }

// CASE 2: Low Quality / "Hallucination Risk"
// If the BEST match is still low confidence (< 0.5), the AI is guessing.  
  const topMatch = destinations[0];
  const isLowConfidence = (topMatch.confidenceScore || 0) < 0.5;

  if (isLowConfidence) {
    return { 
      status: 'WEAK_MATCH', // Frontend can show a yellow warning badge
      message: "We couldn't find exact matches, but here are some popular nearby places." 
    };
  }

  // CASE 3: Too Few Results for a Multi-Day Trip
  if (destinations.length < 3) {
      return {
          status: 'PARTIAL_CONTENT',
          message: "We found a few great spots, but you might need to add more for a full trip."
      };
  }

  return { status: 'OK', message: null };
};
