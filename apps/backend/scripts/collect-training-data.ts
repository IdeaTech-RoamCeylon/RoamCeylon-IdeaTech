/**
 * Collect Latest Training Data
 * Fetches new feedback data, user behavior signals, and updated features from DB
 * Outputs updated training dataset with new engagement signals
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TrainingRecord {
  userId: string;
  destinationId: string;
  user_interest_score: number;
  destination_popularity: number;
  cultural_match: number;
  adventure_match: number;
  relaxation_match: number;
  click_frequency: number;
  feedback_positivity_rate: number;
  engagement_recency: number; // days since last interaction
  diversity_score: number;
  travel_pace_preference: number;
  booking_conversion_rate: number;
  category_affinity: number;
  user_trust_score: number;
  strong_engagement_count: number;
  ignored_recs_count: number;
  label: 0 | 1; // 1 = clicked/engaged, 0 = ignored
  created_at: string;
}

async function collectTrainingData(): Promise<void> {
  console.log('[COLLECT-DATA] Starting training data collection from live DB...\n');

  try {
    // Step 1: Fetch user behavior events (recent activity)
    console.log('[1/6] Fetching user behavior events...');
    const behaviorEvents = await prisma.userBehaviorEvent.findMany({
      take: 5000,
      orderBy: { createdAt: 'desc' },
      select: {
        userId: true,
        itemId: true,
        eventType: true,
        createdAt: true,
        metadata: true,
      },
    });
    console.log(`  ✓ Found ${behaviorEvents.length} behavior events\n`);

    // Step 2: Fetch planner feedback (ratings)
    console.log('[2/6] Fetching planner feedback ratings...');
    const feedbackRatings = await prisma.plannerFeedback.findMany({
      take: 1000,
      orderBy: { createdAt: 'desc' },
      select: {
        userId: true,
        tripId: true,
        feedbackValue: true,
        createdAt: true,
      },
    });
    console.log(`  ✓ Found ${feedbackRatings.length} feedback ratings\n`);

    // Step 3: Fetch user interest profiles (extracted features)
    console.log('[3/6] Fetching user interest profiles...');
    const userProfiles = await prisma.userInterestProfile.findMany({
      take: 2000,
      select: {
        userId: true,
        culturalScore: true,
        adventureScore: true,
        relaxationScore: true,
        timeOfDayPrefs: true,
        categoryDiversity: true,
      },
    });
    console.log(`  ✓ Found ${userProfiles.length} user profiles\n`);

    // Step 4: Fetch recommendation logs and engagement
    console.log('[4/6] Fetching recommendation logs...');
    const recLogs = await prisma.recommendationLog.findMany({
      take: 10000,
      orderBy: { createdAt: 'desc' },
      select: {
        userId: true,
        itemId: true,
        mlScore: true,
        ruleScore: true,
        finalScore: true,
        clicked: true,
        createdAt: true,
      },
    });
    console.log(`  ✓ Found ${recLogs.length} recommendation logs\n`);

    // Step 5: Fetch user category weights
    console.log('[5/6] Fetching user category weights...');
    const categoryWeights = await prisma.userCategoryWeight.findMany({
      select: {
        userId: true,
        category: true,
        weight: true,
        feedbackCount: true,
      },
    });
    console.log(`  ✓ Found ${categoryWeights.length} category weight records\n`);

    // Step 6: Fetch destination scores
    console.log('[6/6] Fetching destination features...');
    const destScores = await prisma.destinationCategoryScore.findMany({
      select: {
        destinationId: true,
        category: true,
        popularityScore: true,
      },
    });
    console.log(`  ✓ Found ${destScores.length} destination records\n`);

    // Step 7: Build training records
    console.log('[7] Building training records...');
    const trainingRecords: TrainingRecord[] = [];
    const feedbackMap = new Map<string, number>();
    const profileMap = new Map<string, any>();
    const categoryWeightMap = new Map<string, number>();
    const destScoreMap = new Map<string, number>();

    // Build lookup maps
    feedbackRatings.forEach((r) => {
      const feedbackVal = typeof r.feedbackValue === 'number' ? r.feedbackValue : 0;
      feedbackMap.set(r.userId, feedbackVal > 3 ? 1 : 0);
    });

    userProfiles.forEach((p) => {
      profileMap.set(p.userId, p);
    });

    categoryWeights.forEach((cw) => {
      categoryWeightMap.set(`${cw.userId}-${cw.category}`, cw.weight);
    });

    destScores.forEach((ds) => {
      destScoreMap.set(`${ds.destinationId}-${ds.category}`, ds.popularityScore);
    });

    // Generate training records from recommendation logs
    const processedPairs = new Set<string>();
    for (const rec of recLogs) {
      if (!rec.userId || !rec.itemId) continue;
      
      const pairKey = `${rec.userId}-${rec.itemId}`;
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const profile = profileMap.get(rec.userId);
      const label = rec.clicked ? 1 : 0;
      const engagement = feedbackMap.get(rec.userId) || 0;

      // Calculate engagement recency (days since interaction)
      const daysSince = Math.floor((Date.now() - rec.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Compute features
      const userInterestScore = profile ? (profile.culturalScore + profile.adventureScore + profile.relaxationScore) / 3 : 0.5;
      const destPopularity = destScoreMap.get(`${rec.itemId}-cultural`) || 0.5;
      const diversityScore = profile?.categoryDiversity || 0.5;
      const trustScore = engagement;
      const bookingRate = 0.5;

      const record: TrainingRecord = {
        userId: rec.userId,
        destinationId: rec.itemId,
        user_interest_score: userInterestScore,
        destination_popularity: destPopularity,
        cultural_match: profile?.culturalScore || 0.5,
        adventure_match: profile?.adventureScore || 0.5,
        relaxation_match: profile?.relaxationScore || 0.5,
        click_frequency: label,
        feedback_positivity_rate: engagement,
        engagement_recency: daysSince,
        diversity_score: diversityScore,
        travel_pace_preference: bookingRate,
        booking_conversion_rate: bookingRate,
        category_affinity: categoryWeightMap.get(`${rec.userId}-cultural`) || 0.5,
        user_trust_score: trustScore,
        strong_engagement_count: rec.clicked ? 1 : 0,
        ignored_recs_count: rec.clicked ? 0 : 1,
        label,
        created_at: rec.createdAt.toISOString(),
      };

      trainingRecords.push(record);
    }

    console.log(`  ✓ Generated ${trainingRecords.length} training records\n`);

    // Step 8: Save to CSV
    const outputPath = path.join(
      __dirname,
      '../data/training',
      `ml_training_dataset_v2_${new Date().toISOString().split('T')[0]}.csv`
    );

    console.log(`[8] Writing training data to: ${outputPath}`);

    // Create CSV with headers
    const headers = Object.keys(trainingRecords[0] || {});
    const csvLines = [
      headers.join(','),
      ...trainingRecords.map((record) =>
        headers.map((h) => {
          const val = (record as any)[h];
          // Escape values with commas or quotes
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      ),
    ];

    const csvContent = csvLines.join('\n');
    fs.writeFileSync(outputPath, csvContent, 'utf-8');

    console.log(`  ✓ Saved ${trainingRecords.length} records to CSV\n`);
    console.log('✅ Data collection complete!\n');
    console.log('📊 Data Summary:');
    console.log(`   - Total training records: ${trainingRecords.length}`);
    console.log(`   - Positive labels (clicked): ${trainingRecords.filter((r) => r.label === 1).length}`);
    console.log(`   - Negative labels (ignored): ${trainingRecords.filter((r) => r.label === 0).length}`);
    console.log(`   - Unique users: ${new Set(trainingRecords.map((r) => r.userId)).size}`);
    console.log(`   - Unique destinations: ${new Set(trainingRecords.map((r) => r.destinationId)).size}\n`);
  } catch (error) {
    console.error('❌ Error collecting training data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute
collectTrainingData().catch((err) => {
  console.error(err);
  process.exit(1);
});
