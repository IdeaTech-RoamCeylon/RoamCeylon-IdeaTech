const TEMPLATES = {
  REORDER: [
    'Route optimized to reduce travel time.',
    'Re-sequenced stops to avoid backtracking.',
    'Smoother flow: less driving, more doing.',
  ],
  DELAY_DROP: [
    'Dropped {place} to keep you on schedule.',
    "Skipped {place} so you don't feel rushed.",
    'Removed {place} to respect the day limit.',
  ],
  DAY_GROUPING: [
    'Clustered nearby spots to save travel time.',
    'Grouped by location for an efficient path.',
    'These spots are close—perfect for one day.',
  ],
  // NEW: Explicit Preference Explanations
  PREFERENCE_MATCH: [
    'Chosen because you prefer {category}.',
    'Top pick based on your interest in {category}.',
    'Prioritized this spot for your {category} focus.',
  ],
};

// Define valid keys for type safety
type ExplanationType =
  | 'REORDER'
  | 'DELAY_DROP'
  | 'DAY_GROUPING'
  | 'PREFERENCE_MATCH';

export const getHumanExplanation = (
  type: ExplanationType,
  context?: string, // Can be placeName OR category
): string => {
  const options = TEMPLATES[type];
  const template = options[Math.floor(Math.random() * options.length)];

  // If no context is provided, return raw template (rare case)
  if (!context) return template;

  // Replace placeholders intelligently based on type
  if (type === 'PREFERENCE_MATCH') {
    return template.replace('{category}', context.toLowerCase());
  }

  return template.replace('{place}', context);
};
