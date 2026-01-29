import { getDistanceKm } from './planningHeuristics';

// --- TYPES ---
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

export interface TripPlan {
  tripId: string;
  title: string;
  destinations: TripDestination[];
}

export type ChangeType = 'REORDER' | 'DELAY' | 'REMOVE' | 'ADD';

interface AdjustmentResult {
  updatedPlan: TripPlan;
  explanation: string;
  warnings: string[];
}

const MAX_HOURS_PER_DAY = 7;

// --- HELPER ---
const getDurationHours = (durationStr: string): number => {
  const lower = durationStr.toLowerCase();
  if (lower.includes('full')) return 8;
  if (lower.includes('half')) return 4;
  return 2; // Default
};

// --- EXISTING LOGIC ---

export const reorderActivity = (
  currentPlan: TripPlan,
  fromIndex: number,
  toIndex: number,
): AdjustmentResult => {
  const warnings: string[] = [];
  const newPlan: TripPlan = structuredClone(currentPlan);

  const [movedItem] = newPlan.destinations.splice(fromIndex, 1);
  newPlan.destinations.splice(toIndex, 0, movedItem);

  newPlan.destinations.forEach((item, index) => {
    item.order = index + 1;
  });

  const isMorningSlot = toIndex === 0 || toIndex === 1;
  const bestTime = movedItem.metadata.bestTimeToVisit?.toLowerCase() || '';

  if (
    isMorningSlot &&
    (bestTime.includes('night') || bestTime.includes('evening'))
  ) {
    warnings.push(
      `Note: ${movedItem.placeName} is usually best visited in the ${bestTime}.`,
    );
  }

  return {
    updatedPlan: newPlan,
    explanation: `Moved ${movedItem.placeName} to position #${toIndex + 1}.`,
    warnings,
  };
};

export const applyDelay = (
  currentPlan: TripPlan,
  delayMinutes: number,
): AdjustmentResult => {
  const newPlan: TripPlan = structuredClone(currentPlan);
  const warnings: string[] = [];

  if (delayMinutes > 120 && newPlan.destinations.length > 2) {
    const droppedItem = newPlan.destinations.pop();
    if (droppedItem) {
      warnings.push(
        `Due to the ${delayMinutes} min delay, we removed ${droppedItem.placeName}.`,
      );
    }
  }

  return {
    updatedPlan: newPlan,
    explanation: `Adjusted itinerary for a ${delayMinutes} min delay.`,
    warnings,
  };
};

// --- NEW INTELLIGENT LOGIC ---

export const addActivityToItinerary = (
  currentPlan: TripPlan,
  newActivity: TripDestination,
): AdjustmentResult => {
  const warnings: string[] = [];
  const currentDestinations = [...currentPlan.destinations];

  // A. Time Check (Improved Logic)
  const currentTotalDuration = currentDestinations.reduce(
    (sum, item) => sum + getDurationHours(item.metadata.duration),
    0,
  );
  const newDuration = getDurationHours(newActivity.metadata.duration);

  if (currentTotalDuration + newDuration > MAX_HOURS_PER_DAY) {
    warnings.push(`Warning: Trip duration exceeds ${MAX_HOURS_PER_DAY} hours.`);
    return {
      updatedPlan: currentPlan,
      explanation: `Could not add ${newActivity.placeName} due to time constraints.`,
      warnings,
    };
  }

  // B. "Cheapest Insertion" Logic (Geometry)
  let bestInsertIndex = -1;
  let minAddedDistance = Infinity;

  for (let i = 0; i <= currentDestinations.length; i++) {
    const prev = i > 0 ? currentDestinations[i - 1] : null;
    const next = i < currentDestinations.length ? currentDestinations[i] : null;

    let addedDist = 0;

    if (!newActivity.coordinates) {
      bestInsertIndex = currentDestinations.length;
      break;
    }

    if (prev && next && prev.coordinates && next.coordinates) {
      const oldDist = getDistanceKm(
        prev.coordinates.latitude,
        prev.coordinates.longitude,
        next.coordinates.latitude,
        next.coordinates.longitude,
      );
      const newDist =
        getDistanceKm(
          prev.coordinates.latitude,
          prev.coordinates.longitude,
          newActivity.coordinates.latitude,
          newActivity.coordinates.longitude,
        ) +
        getDistanceKm(
          newActivity.coordinates.latitude,
          newActivity.coordinates.longitude,
          next.coordinates.latitude,
          next.coordinates.longitude,
        );
      addedDist = newDist - oldDist;
    } else if (prev && prev.coordinates) {
      addedDist = getDistanceKm(
        prev.coordinates.latitude,
        prev.coordinates.longitude,
        newActivity.coordinates.latitude,
        newActivity.coordinates.longitude,
      );
    } else if (next && next.coordinates) {
      addedDist = getDistanceKm(
        newActivity.coordinates.latitude,
        newActivity.coordinates.longitude,
        next.coordinates.latitude,
        next.coordinates.longitude,
      );
    }

    if (addedDist < minAddedDistance) {
      minAddedDistance = addedDist;
      bestInsertIndex = i;
    }
  }

  if (bestInsertIndex === -1) bestInsertIndex = currentDestinations.length;

  currentDestinations.splice(bestInsertIndex, 0, newActivity);
  currentDestinations.forEach((d, index) => (d.order = index + 1));

  return {
    updatedPlan: { ...currentPlan, destinations: currentDestinations },
    explanation: `Added ${newActivity.placeName} at stop #${bestInsertIndex + 1} to minimize travel time.`,
    warnings,
  };
};

export const removeActivityFromItinerary = (
  currentPlan: TripPlan,
  activityIdToRemove: string,
): AdjustmentResult => {
  const newDestinations = currentPlan.destinations.filter(
    (d) => d.id !== activityIdToRemove,
  );
  newDestinations.forEach((d, index) => (d.order = index + 1));

  return {
    updatedPlan: { ...currentPlan, destinations: newDestinations },
    explanation: `Removed item. Remaining stops have been re-ordered.`,
    warnings: [],
  };
};

export const generateStateMessage = (
  change: ChangeType,
  details: string,
): string => {
  switch (change) {
    case 'REORDER':
      return `Updating route... Re-sequenced trip for ${details}.`;
    case 'DELAY':
      return `Delay detected. ${details} We've adjusted your stops.`;
    case 'REMOVE':
      return `Optimizing schedule... Removed ${details}.`;
    case 'ADD':
      return `Adding stop... ${details}`;
    default:
      return 'Updating itinerary...';
  }
};
