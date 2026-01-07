import { TripDestination } from '../types/tripPlanner';

/**
 * SAFETY CHECK 1: Input Validation
 * Returns null if safe, or an error message if unsafe.
 */
export const validateInput = (query: string): string | null => {
  if (!query || query.trim().length === 0) return "Please enter a destination or interest.";
  if (query.trim().length < 3) return "Query is too short. Please be more specific.";
  // basic check for nonsense (optional)
  if (/^[^a-zA-Z0-9]+$/.test(query)) return "Please use valid text characters.";
  return null;
};

/**
 * SAFETY CHECK 2: Confidence & Fallback Analysis
 * Determines if we need to show a warning or a fallback message.
 */
export const analyzeResponseQuality = (destinations: TripDestination[]) => {
  if (!destinations || destinations.length === 0) {
    return { status: 'EMPTY', message: 'No matching places found.' };
  }

  // Check if the top result has a very low confidence score (e.g., < 0.6)
  // (Assuming your confidenceScore is 0-1 based on previous code)
  const topMatch = destinations[0];
  const isLowConfidence = (topMatch.confidenceScore || 0) < 0.6;

  if (isLowConfidence) {
    return { 
      status: 'LOW_CONFIDENCE', 
      message: "We couldn't find an exact match, but here are some popular alternatives you might like." 
    };
  }

  return { status: 'OK', message: null };
};