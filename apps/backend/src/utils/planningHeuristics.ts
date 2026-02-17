// --- TYPES ---
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
  selectionReason?: 'preference' | 'popular';
}

// --- PERSONALIZATION INTERFACE ---
export interface UserPersonalizationProfile {
  likedCategories: string[];
  previouslyVisitedIds: string[];
  dislikedCategories?: string[]; // NEW: To handle negative feedback safely
}

// --- CONFIGURATION ---
const MAX_HOURS_PER_DAY = 7;
const MIN_CONFIDENCE_THRESHOLD = 0.4;

// --- WEIGHTING SYSTEM ---
const WEIGHT_LIKED_CATEGORY = 0.15; // Boost for likes
const WEIGHT_PAST_INTERACTION = 0.25; // Boost for history
const WEIGHT_DISLIKE_PENALTY = 0.2; // NEW: "Soft Penalty" (Safeguard)

// --- HELPER: Haversine Distance ---
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
  return match ? parseInt(match[0], 10) : 2;
};

// --- HELPER: Apply Personalization Signals ---
const calculatePersonalizedScore = (
  place: TripDestination,
  profile?: UserPersonalizationProfile,
): { score: number; reason: 'preference' | 'popular' } => {
  let score = place.confidenceScore || 0;
  let reason: 'preference' | 'popular' = 'popular';

  if (!profile) return { score, reason };

  // 1. Positive Signal: Category Affinity
  if (profile.likedCategories.includes(place.metadata.category)) {
    score += WEIGHT_LIKED_CATEGORY;
    reason = 'preference';
  }

  // 2. Positive Signal: Explicit Interest
  if (profile.previouslyVisitedIds.includes(place.id)) {
    score += WEIGHT_PAST_INTERACTION;
    reason = 'preference';
  }

  // 3. Negative Signal: SAFEGUARDED PENALTY
  // Instead of completely banning (Boolean False), we lower the score.
  if (profile.dislikedCategories?.includes(place.metadata.category)) {
    score -= WEIGHT_DISLIKE_PENALTY;
    // We do NOT set reason to 'preference' here; dislikes should just lower rank.
  }

  // Clamp score (Min 0.1 so it doesn't break math, Max 1.0)
  return { score: Math.max(0.1, Math.min(score, 1.0)), reason };
};

// --- MAIN ALGORITHM ---
export const distributeActivitiesAcrossDays = (
  allDestinations: TripDestination[],
  numberOfDays: number,
  userProfile?: UserPersonalizationProfile,
): TripDestination[][] => {
  // 1. Score & Tag
  const pool = allDestinations
    .map((d) => {
      const { score, reason } = calculatePersonalizedScore(d, userProfile);
      return {
        ...d,
        confidenceScore: score,
        selectionReason: reason,
        _hours: parseDuration(d.metadata.duration),
        _assigned: false,
      };
    })
    .filter((d) => {
      if (!d.coordinates) return false;
      // RULE: Score must be >= 0.4
      // A "Disliked" place (0.8 - 0.2 = 0.6) will SURVIVE.
      // A "Mediocre" disliked place (0.5 - 0.2 = 0.3) will be DROPPED.
      return (d.confidenceScore || 0) >= MIN_CONFIDENCE_THRESHOLD;
    });

  // Sort by PERSONALIZED Score
  pool.sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0));

  const dayPlans: TripDestination[][] = [];

  for (let day = 0; day < numberOfDays; day++) {
    const currentDay: TripDestination[] = [];
    let currentDayHours = 0;

    const anchorIndex = pool.findIndex((p) => !p._assigned);
    if (anchorIndex === -1) break;

    const anchor = pool[anchorIndex];
    anchor._assigned = true;
    currentDay.push(anchor);
    currentDayHours += anchor._hours;

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
