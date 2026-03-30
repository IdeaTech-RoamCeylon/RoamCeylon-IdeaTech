import * as fs from 'fs';
import * as path from 'path';

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

interface UserFeatures {
  id: string;
  cultural: number;
  adventure: number;
  relaxation: number;
  diversity: number;
  trust: number;
  totalFeedback: number;
  hasPositiveFeedback: boolean;
}

interface DestinationFeatures {
  id: string;
  category: string;
  popularity: number;
}

async function main() {
  const numUsers = Number(process.argv[2] ?? '200');
  const numDestinations = Number(process.argv[3] ?? '100');
  const numEvents = Number(process.argv[4] ?? '5000');

  console.log(
    `Generating synthetic dataset with ${numUsers} users, ${numDestinations} destinations, ${numEvents} events...`,
  );

  const categories = ['cultural', 'adventure', 'relaxation', 'mixed'];
  const eventTypes = [
    'view',
    'view',
    'view',
    'trip_click',
    'save',
    'save_trip',
    'book',
  ];
  const strongEngagementTypes = new Set([
    'trip_click',
    'save',
    'save_trip',
    'book',
  ]);

  // Synthetic users
  const users: UserFeatures[] = [];
  for (let i = 0; i < numUsers; i++) {
    const id = `user_${i + 1}`;
    const base = randomChoice(categories);

    let cultural = randomFloat(0.2, 0.8);
    let adventure = randomFloat(0.2, 0.8);
    let relaxation = randomFloat(0.2, 0.8);

    if (base === 'cultural') cultural = randomFloat(0.6, 1.0);
    if (base === 'adventure') adventure = randomFloat(0.6, 1.0);
    if (base === 'relaxation') relaxation = randomFloat(0.6, 1.0);

    const diversity = clamp01(randomFloat(0, 1));
    const trust = clamp01(randomFloat(0.3, 0.9));
    const totalFeedback = randomInt(0, 50);
    const hasPositiveFeedback = Math.random() < 0.7; // 70% of users have some positive feedback

    users.push({
      id,
      cultural,
      adventure,
      relaxation,
      diversity,
      trust,
      totalFeedback,
      hasPositiveFeedback,
    });
  }

  // Synthetic destinations
  const destinations: DestinationFeatures[] = [];
  for (let i = 0; i < numDestinations; i++) {
    const id = `dest_${i + 1}`;
    const category = randomChoice(categories);
    const popularity = randomFloat(0, 1);
    destinations.push({ id, category, popularity });
  }

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const rows: string[] = [];
  const header = [
    'user_id',
    'item_id',
    'event_type',
    'created_at',
    'destination_category',
    'destination_popularity',
    'cultural_score',
    'adventure_score',
    'relaxation_score',
    'category_diversity',
    'trust_score',
    'user_total_feedback_count',
    'is_strong_engagement',
    'has_positive_feedback',
    'label',
  ];
  rows.push(header.join(','));

  for (let i = 0; i < numEvents; i++) {
    const user = randomChoice(users);
    const dest = randomChoice(destinations);
    const eventType = randomChoice(eventTypes);

    // Time within last 30 days
    const ts = new Date(now - Math.random() * thirtyDaysMs).toISOString();

    const isStrongEngagement = strongEngagementTypes.has(eventType) ? 1 : 0;

    // Probability of positive feedback depends on alignment of user interest + destination category
    let alignment = 0.33;
    if (dest.category === 'cultural') alignment = user.cultural;
    else if (dest.category === 'adventure') alignment = user.adventure;
    else if (dest.category === 'relaxation') alignment = user.relaxation;
    else alignment = (user.cultural + user.adventure + user.relaxation) / 3;

    const positiveProb = clamp01(0.2 * user.trust + 0.5 * alignment + 0.3 * dest.popularity);
    const hasPositiveFeedback = user.hasPositiveFeedback && Math.random() < positiveProb ? 1 : 0;

    const label = isStrongEngagement || hasPositiveFeedback ? 1 : 0;

    const row = [
      user.id,
      dest.id,
      eventType,
      ts,
      dest.category,
      dest.popularity.toFixed(3),
      user.cultural.toFixed(3),
      user.adventure.toFixed(3),
      user.relaxation.toFixed(3),
      user.diversity.toFixed(3),
      user.trust.toFixed(3),
      String(user.totalFeedback),
      String(isStrongEngagement),
      String(hasPositiveFeedback),
      String(label),
    ];

    rows.push(row.join(','));
  }

  const outDir = path.join(process.cwd(), 'data', 'training');
  fs.mkdirSync(outDir, { recursive: true });
  const fileName = path.join(
    outDir,
    `synthetic_dataset_${new Date().toISOString().slice(0, 10)}.csv`,
  );

  fs.writeFileSync(fileName, rows.join('\n'), 'utf8');
  console.log(`Synthetic dataset written to ${fileName}`);
}

main().catch((err) => {
  console.error('Synthetic dataset generation failed', err);
  process.exit(1);
});
