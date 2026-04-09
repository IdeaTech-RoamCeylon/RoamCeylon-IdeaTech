import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function evaluateLiveModel(k: number = 5) {
  console.log('=============================================');
  console.log('🚀 LIVE MODEL EVALUATION: ML vs RULE-BASED');
  console.log(`📊 Evaluating Top ${k} Recommendations (Precision@${k})`);
  console.log('=============================================\n');

  // 1. Fetch all recommendation logs
  const logs = await prisma.recommendationLog.findMany({
    where: {
      source: { in: ['ml', 'rule-based'] },
    },
    orderBy: { finalScore: 'desc' }
  });

  if (logs.length === 0) {
    console.log('⚠️ No live recommendation data found in the database yet.');
    return;
  }

  // 2. Separate logs by source
  const mlLogs = logs.filter(log => log.source === 'ml');
  const ruleLogs = logs.filter(log => log.source === 'rule-based');

  // Helper function to calculate metrics
  function calculateMetrics(sourceLogs: typeof logs, sourceName: string) {
    if (sourceLogs.length === 0) {
      console.log(`No data for ${sourceName} system.\n`);
      return;
    }

    // A. Click-Through Rate (CTR)
    const clicks = sourceLogs.filter(log => log.clicked).length;
    const ctr = (clicks / sourceLogs.length) * 100;

    // B. Precision@K (Simulated: out of the top K items shown, how many were clicked?)
    // In a real live environment, we group by recommendationId (the session). 
    // Here we calculate the average precision across all sessions.
    const sessions = [...new Set(sourceLogs.map(log => log.recommendationId))];
    let totalPrecision = 0;
    let validSessions = 0;

    sessions.forEach(sessionId => {
      if (!sessionId) return;
      const sessionLogs = sourceLogs.filter(l => l.recommendationId === sessionId).slice(0, k);
      if (sessionLogs.length > 0) {
        const sessionClicks = sessionLogs.filter(l => l.clicked).length;
        totalPrecision += (sessionClicks / k);
        validSessions++;
      }
    });

    const precisionAtK = validSessions > 0 ? (totalPrecision / validSessions) * 100 : 0;

    console.log(`--- ${sourceName.toUpperCase()} SYSTEM ---`);
    console.log(`Total Recommendations Served: ${sourceLogs.length}`);
    console.log(`Total Clicks: ${clicks}`);
    console.log(`CTR (Click-Through Rate): ${ctr.toFixed(2)}%`);
    console.log(`Precision@${k}: ${precisionAtK.toFixed(2)}%`);
    console.log('---------------------------------------------\n');
  }

  // 3. Print the comparison
  calculateMetrics(mlLogs, 'Machine Learning');
  calculateMetrics(ruleLogs, 'Rule-Based');

  // 4. Feedback Positivity (Check UserBehaviorEvents for positive actions on clicked items)
  console.log('--- FEEDBACK POSITIVITY (POST-CLICK) ---');
  const positiveEvents = await prisma.userBehaviorEvent.count({
    where: {
      eventType: { in: ['save_trip', 'positive_rating', 'share_destination'] }
    }
  });
  console.log(`Total Positive User Actions logged: ${positiveEvents}`);
  console.log('=============================================\n');
}

evaluateLiveModel()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });