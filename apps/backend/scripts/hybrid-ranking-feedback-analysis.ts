import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

type EventRow = {
  user_id: string;
  item_id: string;
  event_type: string;
  destination_category: string;
  label: number;
  user_item_affinity: number;
};

type RatingStats = {
  totalValid: number;
  positive: number;
  neutral: number;
  negative: number;
  positivityRate: number;
  negativityRate: number;
  avgRating: number;
};

function parseCsv(filePath: string): EventRow[] {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',');
  const idx = (name: string) => headers.indexOf(name);

  const iUser = idx('user_id');
  const iItem = idx('item_id');
  const iEvent = idx('event_type');
  const iCat = idx('destination_category');
  const iLabel = idx('label');
  const iAffinity = idx('user_item_affinity');

  if (
    iUser < 0 ||
    iItem < 0 ||
    iEvent < 0 ||
    iCat < 0 ||
    iLabel < 0 ||
    iAffinity < 0
  ) {
    throw new Error('Required columns missing in training dataset');
  }

  const out: EventRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length <= Math.max(iAffinity, iLabel, iCat, iEvent, iItem, iUser)) continue;

    out.push({
      user_id: cols[iUser],
      item_id: cols[iItem],
      event_type: cols[iEvent],
      destination_category: cols[iCat],
      label: Number(cols[iLabel] ?? 0),
      user_item_affinity: Number(cols[iAffinity] ?? 0),
    });
  }
  return out;
}

function generateDeterministicEmbedding(text: string): number[] {
  const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  const tokens = cleaned.split(/\s+/).filter(Boolean);

  const dim = 1536;
  const vector: number[] = Array.from({ length: dim }, () => 0);

  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    const token = tokens[tokenIndex];
    const ngrams = getCharNGrams(token, 3);
    for (const ng of ngrams) {
      const hash = hashToken(ng);
      for (let i = 0; i < dim; i++) {
        vector[i] += (((hash + i * 13) % 100) / 100) * (1 / (tokenIndex + 1));
      }
    }
  }

  const mag = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
  return mag > 0 ? vector.map((v) => v / mag) : vector;
}

function getCharNGrams(word: string, n: number): string[] {
  const padded = `^${word}$`;
  const out: string[] = [];
  for (let i = 0; i <= padded.length - n; i++) out.push(padded.substring(i, i + n));
  return out;
}

function hashToken(token: string): number {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const ch = token.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash |= 0;
  }
  return Math.abs(hash);
}

function computeFeedbackSignalStats(events: EventRow[]) {
  const strongEvents = new Set(['trip_click', 'save', 'save_trip', 'book']);

  const total = events.length;
  const clicks = events.filter((e) => e.event_type === 'trip_click').length;
  const strongEngagement = events.filter((e) => strongEvents.has(e.event_type)).length;
  const ignored = events.filter((e) => e.event_type === 'view' && e.label === 0).length;
  const positiveLabels = events.filter((e) => e.label === 1).length;
  const avgAffinity = events.reduce((s, e) => s + (Number.isFinite(e.user_item_affinity) ? e.user_item_affinity : 0), 0) / Math.max(total, 1);

  return {
    totalEvents: total,
    recommendationClicks: clicks,
    clickRate: total ? clicks / total : 0,
    strongEngagementEvents: strongEngagement,
    strongEngagementRate: total ? strongEngagement / total : 0,
    ignoredRecommendations: ignored,
    ignoredRate: total ? ignored / total : 0,
    positiveLabelRate: total ? positiveLabels / total : 0,
    avgUserItemAffinity: avgAffinity,
  };
}

function computeCategoryImbalance(events: EventRow[]) {
  const pos = events.filter((e) => e.label === 1);
  const countByCategory = new Map<string, number>();
  for (const e of pos) {
    countByCategory.set(e.destination_category, (countByCategory.get(e.destination_category) ?? 0) + 1);
  }

  const total = pos.length;
  const distribution = Array.from(countByCategory.entries())
    .map(([category, count]) => ({ category, count, share: total ? count / total : 0 }))
    .sort((a, b) => b.share - a.share);

  const topShare = distribution.length ? distribution[0].share : 0;
  const imbalanceFlag = topShare >= 0.45;

  return {
    positiveEventCount: total,
    categoryDistribution: distribution,
    topCategoryShare: topShare,
    imbalanceFlag,
  };
}

function computeIrrelevanceProxy(events: EventRow[]) {
  const lowAffinityThreshold = 0.35;
  const lowAffinityIgnored = events.filter(
    (e) => e.event_type === 'view' && e.label === 0 && e.user_item_affinity < lowAffinityThreshold,
  ).length;

  const viewEvents = events.filter((e) => e.event_type === 'view').length;

  return {
    lowAffinityThreshold,
    lowAffinityIgnoredCount: lowAffinityIgnored,
    viewEvents,
    lowAffinityIgnoredRateWithinViews: viewEvents ? lowAffinityIgnored / viewEvents : 0,
  };
}

async function computeRatingSignals(): Promise<RatingStats> {
  const feedback = await prisma.plannerFeedback.findMany();

  let positive = 0;
  let neutral = 0;
  let negative = 0;
  let total = 0;
  let sum = 0;

  for (const f of feedback as any[]) {
    const value = f.feedbackValue as any;
    const rating = typeof value === 'number' ? value : value?.rating;
    if (typeof rating !== 'number') continue;

    total++;
    sum += rating;
    if (rating >= 4) positive++;
    else if (rating <= 2) negative++;
    else neutral++;
  }

  return {
    totalValid: total,
    positive,
    neutral,
    negative,
    positivityRate: total ? positive / total : 0,
    negativityRate: total ? negative / total : 0,
    avgRating: total ? sum / total : 0,
  };
}

async function computeRankingStability() {
  const testQueries = [
    'temples in Kandy',
    'beaches near Colombo',
    'historical sites',
    'nature parks',
  ];

  let unstableQueries = 0;
  const perQuery: Array<{ query: string; stable: boolean }> = [];

  for (const q of testQueries) {
    const runs: string[] = [];
    for (let i = 0; i < 5; i++) {
      const emb = generateDeterministicEmbedding(q);
      const res = (await prisma.$queryRawUnsafe(
        `SELECT id, title, 1 - (embedding <=> $1::vector) as score
         FROM embeddings
         ORDER BY (embedding <=> $1::vector) ASC
         LIMIT 10`,
        `[${emb.join(',')}]`,
      )) as Array<{ id: number; title: string; score: number }>;

      const normalized = JSON.stringify(
        res.map((r) => ({ id: r.id, score: Number(Number(r.score).toFixed(6)) })),
      );
      runs.push(normalized);
    }

    const stable = runs.every((r) => r === runs[0]);
    if (!stable) unstableQueries++;
    perQuery.push({ query: q, stable });
  }

  return {
    testedQueries: testQueries.length,
    unstableQueries,
    instabilityRate: testQueries.length ? unstableQueries / testQueries.length : 0,
    perQuery,
  };
}

function toPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

async function main() {
  const csvPath = path.join(process.cwd(), 'data', 'training', 'ml_training_dataset_extended.csv');
  const reportPath = path.join(process.cwd(), 'HYBRID_RANKING_FEEDBACK_ANALYSIS.md');

  const events = parseCsv(csvPath);
  const behavior = computeFeedbackSignalStats(events);
  const category = computeCategoryImbalance(events);
  const irrelevance = computeIrrelevanceProxy(events);
  const ratings = await computeRatingSignals();
  const stability = await computeRankingStability();

  const unstableRankingFlag = stability.instabilityRate > 0.0;
  const categoryImbalanceFlag = category.imbalanceFlag;
  const irrelevantFlag = behavior.ignoredRate > 0.45 || irrelevance.lowAffinityIgnoredRateWithinViews > 0.5;

  const md = `# Hybrid Ranking Stability Monitoring & Model Feedback Analysis

Date: ${new Date().toISOString().slice(0, 10)}

## 1) Hybrid Ranking Stability Monitoring

### Unstable Rankings
- Tested queries: ${stability.testedQueries}
- Unstable queries: ${stability.unstableQueries}
- Instability rate: ${toPct(stability.instabilityRate)}
- Status: ${unstableRankingFlag ? 'FLAGGED' : 'STABLE'}

### Category Imbalance
- Positive events analyzed: ${category.positiveEventCount}
- Top category share: ${toPct(category.topCategoryShare)}
- Imbalance rule (top share >= 45%): ${categoryImbalanceFlag ? 'FLAGGED' : 'OK'}

Top category distribution (positive signals):
${category.categoryDistribution
  .slice(0, 6)
  .map((c) => `- ${c.category}: ${c.count} (${toPct(c.share)})`)
  .join('\n')}

### Irrelevant Recommendation Proxy
- Ignored recommendations (view + label=0): ${behavior.ignoredRecommendations}
- Ignored rate (all events): ${toPct(behavior.ignoredRate)}
- Low-affinity ignored rate within views: ${toPct(irrelevance.lowAffinityIgnoredRateWithinViews)}
- Status: ${irrelevantFlag ? 'FLAGGED' : 'OK'}

## 2) Model Feedback Analysis

### User Behavior Signals
- Total events: ${behavior.totalEvents}
- Recommendation clicks (trip_click): ${behavior.recommendationClicks} (${toPct(behavior.clickRate)})
- Strong engagement events (trip_click/save/save_trip/book): ${behavior.strongEngagementEvents} (${toPct(behavior.strongEngagementRate)})
- Ignored recommendations: ${behavior.ignoredRecommendations} (${toPct(behavior.ignoredRate)})
- Positive-label rate: ${toPct(behavior.positiveLabelRate)}
- Average user-item affinity: ${behavior.avgUserItemAffinity.toFixed(3)}

### User Feedback Ratings (DB)
- Valid ratings: ${ratings.totalValid}
- Positive (>=4): ${ratings.positive} (${toPct(ratings.positivityRate)})
- Neutral (=3): ${ratings.neutral}
- Negative (<=2): ${ratings.negative} (${toPct(ratings.negativityRate)})
- Average rating: ${ratings.avgRating.toFixed(2)}

## Recommended Next Improvements

1. If category imbalance is flagged, raise diversity penalty slightly for over-dominant categories and re-evaluate.
2. If irrelevant proxy is flagged, increase minimum similarity gate for low-confidence contexts.
3. Use click-through and ignored-rate trends weekly as release gates before weight changes.
4. Add cohort slicing (new users vs returning users) to isolate cold-start behavior.
`;

  fs.writeFileSync(reportPath, md, 'utf8');

  console.log('=== Hybrid Ranking & Feedback Analysis Complete ===');
  console.log(`Report written to: ${reportPath}`);
  console.log(`Ranking instability: ${toPct(stability.instabilityRate)}`);
  console.log(`Top category share: ${toPct(category.topCategoryShare)}`);
  console.log(`Ignored rate: ${toPct(behavior.ignoredRate)}`);
  console.log(`Rating positivity: ${toPct(ratings.positivityRate)}`);
}

main()
  .catch((error) => {
    console.error('Analysis failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
