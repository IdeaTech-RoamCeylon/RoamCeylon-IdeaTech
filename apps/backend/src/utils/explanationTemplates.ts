const TEMPLATES = {
  REORDER: [
    'Updated the flow to make travel easier.',
    'Re-sequenced your stops for a smoother route.',
    'Adjusted the order to save you travel time.',
  ],
  DELAY_DROP: [
    'Removed {place} to keep your day on track.',
    "Skipped {place} so you don't feel rushed.",
    'Due to the delay, we had to drop {place}.',
  ],
  DAY_GROUPING: [
    'Grouped these together because they are close by.',
    'Clustered these spots to minimize driving.',
    'These fit perfectly into a single day trip.',
  ],
};

export const getHumanExplanation = (
  type: 'REORDER' | 'DELAY_DROP' | 'DAY_GROUPING',
  placeName?: string,
): string => {
  const options = TEMPLATES[type];
  // Pick a random template
  const template = options[Math.floor(Math.random() * options.length)];
  return placeName ? template.replace('{place}', placeName) : template;
};
