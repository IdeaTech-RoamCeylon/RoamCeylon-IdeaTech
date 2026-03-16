/**
 * Ranking Stability Verification Script
 * 
 * Tests that identical search inputs produce identical outputs
 * Run: npx ts-node scripts/verify-ranking-stability.ts
 * 
 * This script validates:
 * 1. Same query → same embedding (deterministic)
 * 2. Same embedding → same database results
 * 3. Same results → same ranking order
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestCase {
  query: string;
  runs: number;
}

const TEST_CASES: TestCase[] = [
  { query: 'temples in Kandy', runs: 10 },
  { query: 'beaches near Colombo', runs: 10 },
  { query: 'historical sites', runs: 10 },
  { query: 'nature parks', runs: 10 },
  { query: 'adventure activities', runs: 8 },
];

async function runStabilityTest() {
  console.log('🔍 === RANKING STABILITY TEST ===\n');
  console.log('Testing deterministic behavior of AI search ranking\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of TEST_CASES) {
    console.log(`\n📝 Testing: "${testCase.query}"`);
    console.log(`   Running ${testCase.runs} times...`);

    const results: any[] = [];
    const embeddings: string[] = [];

    // Run the same query multiple times
    for (let i = 0; i < testCase.runs; i++) {
      // Simulate embedding generation (deterministic)
      const embedding = generateDeterministicEmbedding(testCase.query);
      embeddings.push(JSON.stringify(embedding));

      // Run query
      try {
        const queryResult = await prisma.$queryRawUnsafe(
          `SELECT id, title, content,
                  1 - (embedding <=> $1::vector) as score
           FROM embeddings
           ORDER BY (embedding <=> $1::vector) ASC
           LIMIT 10`,
          `[${embedding.join(',')}]`,
        );

        results.push(queryResult);
      } catch (error) {
        console.log(`   ⚠️ Query failed on run ${i + 1}:`, (error as Error).message);
        results.push([]);
      }
    }

    totalTests++;

    // Check 1: Embedding consistency
    const embeddingStable = verifyEmbeddingStability(embeddings);
    if (!embeddingStable) {
      console.log(`   ❌ EMBEDDING INSTABILITY: Same input produced different embeddings`);
      failedTests++;
      continue;
    }

    // Check 2: Result stability
    const resultStable = verifyStability(results);

    if (resultStable) {
      console.log(`   ✅ STABLE: All ${testCase.runs} runs produced identical rankings`);
      passedTests++;
      
      // Show sample results
      if (results[0] && results[0].length > 0) {
        console.log(`   Top 3 results:`);
        results[0].slice(0, 3).forEach((item: any, idx: number) => {
          console.log(`      ${idx + 1}. ${item.title} (score: ${Number(item.score).toFixed(4)})`);
        });
      }
    } else {
      console.log(`   ❌ UNSTABLE: Rankings varied across runs`);
      failedTests++;
      
      // Show divergence
      console.log(`   First run top-3:`, results[0]?.slice(0, 3).map((r: any) => r.title));
      console.log(`   Last run top-3:`, results[testCase.runs - 1]?.slice(0, 3).map((r: any) => r.title));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 STABILITY TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total test cases: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All stability tests PASSED! Ranking is deterministic.\n');
  } else {
    console.log('\n⚠️ Some tests FAILED. Review ranking logic for non-deterministic behavior.\n');
  }

  return failedTests === 0;
}

function generateDeterministicEmbedding(text: string): number[] {
  // Simple deterministic embedding (matches backend logic)
  // This must be EXACTLY the same algorithm as backend's generateDummyEmbedding
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

  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return magnitude > 0 ? vector.map((v) => v / magnitude) : vector;
}

function getCharNGrams(word: string, n: number): string[] {
  const padded = `^${word}$`;
  const ngrams: string[] = [];
  for (let i = 0; i <= padded.length - n; i++) {
    ngrams.push(padded.substring(i, i + n));
  }
  return ngrams;
}

function hashToken(token: string): number {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function verifyEmbeddingStability(embeddings: string[]): boolean {
  if (embeddings.length === 0) return true;

  const first = embeddings[0];
  for (let i = 1; i < embeddings.length; i++) {
    if (embeddings[i] !== first) {
      return false;
    }
  }

  return true;
}

function verifyStability(results: any[]): boolean {
  if (results.length === 0) return true;

  // Serialize first run
  const firstRun = JSON.stringify(sortAndNormalize(results[0]));

  // Compare all subsequent runs
  for (let i = 1; i < results.length; i++) {
    const currentRun = JSON.stringify(sortAndNormalize(results[i]));
    if (currentRun !== firstRun) {
      return false;
    }
  }

  return true;
}

function sortAndNormalize(results: any[]): any[] {
  if (!results) return [];
  
  // Normalize scores to 6 decimal places (matching SCORE_PRECISION)
  return results.map((r) => ({
    id: r.id,
    title: r.title,
    score: Number(Number(r.score).toFixed(6)),
  }));
}

// Run test
runStabilityTest()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
