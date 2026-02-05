const TEMPLATES = {
  REORDER: [
    'Route optimized to reduce travel time.', // Shorter
    'Re-sequenced stops to avoid backtracking.', // More specific (why?)
    'Smoother flow: less driving, more doing.', // UX-friendly
  ],
  DELAY_DROP: [
    'Dropped {place} to keep you on schedule.', // Active voice
    "Skipped {place} so you don't feel rushed.", // Empathetic
    'Removed {place} to respect the day limit.', // Clear reason
  ],
  DAY_GROUPING: [
    'Clustered nearby spots to save travel time.', // Value-driven
    'Grouped by location for an efficient path.', // Professional
    'These spots are close—perfect for one day.', // conversational
  ],
};

export const getHumanExplanation = (
  type: 'REORDER' | 'DELAY_DROP' | 'DAY_GROUPING',
  placeName?: string,
): string => {
  const options = TEMPLATES[type];
  const template = options[Math.floor(Math.random() * options.length)];
  return placeName ? template.replace('{place}', placeName) : template;
};
