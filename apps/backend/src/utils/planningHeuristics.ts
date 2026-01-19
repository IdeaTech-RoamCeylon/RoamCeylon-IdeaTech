// --- SELF-CONTAINED TYPES ---
export interface TripDestination {
  id: string;
  order: number;
  placeName: string;
  shortDescription: string;
  coordinates?: { latitude: number; longitude: number };
  metadata: {
    duration: string;
    category: 'adventure' | 'relaxation' | 'culture' | 'shopping' | 'food';
    bestTimeToVisit?: string;
  };
  confidenceScore?: number;
}

// --- CONFIGURATION ---
const MAX_HOURS_PER_DAY = 7; // Leave buffer for travel/lunch
const MIN_CONFIDENCE_THRESHOLD = 0.4; // <--- NEW: Filter out "noise"

// --- HELPER: Haversine Distance Formula ---
export const getDistanceKm = (
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

// --- HELPER: Parse Duration ---
// Converts "2 hours", "Half Day" into numeric hours
const parseDuration = (durationStr?: string): number => {
  if (!durationStr) return 2; // Default
  const lower = durationStr.toLowerCase();
  if (lower.includes('half')) return 4;
  if (lower.includes('full')) return 8;
  const match = lower.match(/(\d+)/);
  return match ? parseInt(match[0]) : 2;
};

// --- MAIN ALGORITHM: Multi-Day Distributor ---
export const distributeActivitiesAcrossDays = (
  allDestinations: TripDestination[],
  numberOfDays: number,
): TripDestination[][] => {
  // 1. Prep: Calculate numeric duration for everyone
  const pool = allDestinations.map((d) => ({
    ...d,
    _hours: parseDuration(d.metadata.duration),
    _assigned: false,
  }));

  // Sort by confidence (Highest priority first)
  pool.sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0));

  const dayPlans: TripDestination[][] = [];

  for (let day = 0; day < numberOfDays; day++) {
    const currentDay: TripDestination[] = [];
    let currentDayHours = 0;

    // 2. Pick the best "Anchor" (Starting point) for this day
    // We take the highest confidence item that hasn't been assigned yet.
    const anchorIndex = pool.findIndex((p) => !p._assigned);
    if (anchorIndex === -1) break; // No more places left

    const anchor = pool[anchorIndex];
    anchor._assigned = true;
    currentDay.push(anchor);
    currentDayHours += anchor._hours;

    // 3. Fill the rest of the day with NEAREST neighbors (Distance Logic)
    while (currentDayHours < MAX_HOURS_PER_DAY) {
      let bestCandidateIdx = -1;
      let minDistance = Infinity;

      // Find the closest unassigned place to the LAST place added
      const lastPlace = currentDay[currentDay.length - 1];

      pool.forEach((candidate, idx) => {
        if (
          candidate._assigned ||
          !candidate.coordinates ||
          !lastPlace.coordinates
        )
          return;

        const dist = getDistanceKm(
          lastPlace.coordinates.latitude,
          lastPlace.coordinates.longitude,
          candidate.coordinates.latitude,
          candidate.coordinates.longitude,
        );

        // Heuristic: Must be close AND fit in remaining time
        if (
          dist < minDistance &&
          currentDayHours + candidate._hours <= MAX_HOURS_PER_DAY
        ) {
          minDistance = dist;
          bestCandidateIdx = idx;
        }
      });

      // If we found a neighbor, add them
      if (bestCandidateIdx !== -1) {
        const candidate = pool[bestCandidateIdx];
        candidate._assigned = true;
        currentDay.push(candidate);
        currentDayHours += candidate._hours;
      } else {
        break; // No more close places fit in this day
      }
    }

    dayPlans.push(currentDay);
  }

  return dayPlans;
};
