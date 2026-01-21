// apps/backend/src/utils/planningHeuristics.ts

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
const MAX_HOURS_PER_DAY = 7;
const MIN_CONFIDENCE_THRESHOLD = 0.4; // <--- Now we will actually use this

// --- HELPER: Haversine Distance Formula ---
export const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371;
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
const parseDuration = (durationStr?: string): number => {
  if (!durationStr) return 2;
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
  // 1. IMPROVED PREP: Filter & Sanitize
  const pool = allDestinations
    .filter((d) => {
      // RULE 1: Must have valid coordinates
      if (!d.coordinates) return false;

      // RULE 2: STRICT Quality Filter (This uses the variable!)
      return (d.confidenceScore || 0) >= MIN_CONFIDENCE_THRESHOLD;
    })
    .map((d) => ({
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

    // 2. Pick the best "Anchor"
    const anchorIndex = pool.findIndex((p) => !p._assigned);
    if (anchorIndex === -1) break;

    const anchor = pool[anchorIndex];
    anchor._assigned = true;
    currentDay.push(anchor);
    currentDayHours += anchor._hours;

    // 3. Greedy Scheduler (Nearest Neighbor)
    while (currentDayHours < MAX_HOURS_PER_DAY) {
      let bestCandidateIdx = -1;
      let minDistance = Infinity;
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

        if (
          dist < minDistance &&
          currentDayHours + candidate._hours <= MAX_HOURS_PER_DAY
        ) {
          minDistance = dist;
          bestCandidateIdx = idx;
        }
      });

      if (bestCandidateIdx !== -1) {
        const candidate = pool[bestCandidateIdx];
        candidate._assigned = true;
        currentDay.push(candidate);
        currentDayHours += candidate._hours;
      } else {
        break;
      }
    }

    dayPlans.push(currentDay);
  }

  return dayPlans;
};
