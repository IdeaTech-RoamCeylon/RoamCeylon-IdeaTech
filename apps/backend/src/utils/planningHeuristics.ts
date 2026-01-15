// --- SELF-CONTAINED TYPES (To avoid import errors) ---
export interface TripDestination {
  id: string;
  order: number;
  placeName: string;
  shortDescription: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  metadata: {
    duration: string;
    category: 'adventure' | 'relaxation' | 'culture' | 'shopping' | 'food';
    bestTimeToVisit?: string;
  };
  confidenceScore?: number;
}

// --- CONFIGURATION ---
const GROUP_RADIUS_KM = 10; // How close places must be to be grouped
const MAX_SUGGESTIONS = 5; // Limit the number of resulting groups

// --- HELPER: Haversine Distance Formula ---
const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// --- MAIN FUNCTION ---
export const applyPlanningHeuristics = (
  allDestinations: TripDestination[],
): TripDestination[][] => {
  // 1. FILTER & SORT (Rule: Prioritize higher confidence)
  const validDestinations = allDestinations
    .filter((d) => d.coordinates)
    .sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0));

  const groupedResults: TripDestination[][] = [];
  const processedIds = new Set<string>();

  // 2. GROUP NEARBY LOCATIONS (Rule: Group nearby)
  for (const anchor of validDestinations) {
    if (processedIds.has(anchor.id)) continue;

    const group: TripDestination[] = [anchor];
    processedIds.add(anchor.id);

    // Find neighbors
    for (const candidate of validDestinations) {
      if (processedIds.has(candidate.id)) continue;

      const dist = getDistanceKm(
        anchor.coordinates!.latitude,
        anchor.coordinates!.longitude,
        candidate.coordinates!.latitude,
        candidate.coordinates!.longitude,
      );

      if (dist <= GROUP_RADIUS_KM) {
        group.push(candidate);
        processedIds.add(candidate.id);
      }
    }

    groupedResults.push(group);
  }

  // 3. LIMIT RESULTS
  return groupedResults.slice(0, MAX_SUGGESTIONS);
};
