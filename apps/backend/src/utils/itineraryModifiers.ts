export interface TripPlan {
  tripId: string;
  title: string;
  destinations: TripDestination[];
}

export interface TripDestination {
  id: string;
  order: number;
  placeName: string;
  shortDescription: string;
  metadata: {
    duration: string;
    category: 'adventure' | 'relaxation' | 'culture' | 'shopping' | 'food';
    bestTimeToVisit?: string;
  };
}

export type ChangeType = 'REORDER' | 'DELAY' | 'REMOVE';

interface AdjustmentResult {
  updatedPlan: TripPlan;
  explanation: string;
  warnings: string[];
}

// --- LOGIC ---

/**
 * 1. SMART REORDER
 */
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

/**
 * 2. HANDLE DELAY
 */
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

/**
 * 3. STATE EXPLAINER
 */
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
    default:
      return 'Updating itinerary...';
  }
};
