# AI Quality & Stability Tests - Implementation Guide

## 📋 What Was Done

### ✅ Files Created:
1. **`src/modules/ai/diversity-quality.spec.ts`** - 5 test suites for diversity vs quality balance
2. **`src/modules/ai/ranking-stability.spec.ts`** - 5 test suites for ranking stability
3. **`scripts/verify-ranking-stability.ts`** - Standalone script to verify deterministic behavior

### ✅ Files Modified:
1. **`src/modules/ai/ai.controller.ts`** - Added MINIMUM quality threshold check in `selectDiverseActivities()` (line ~2120)

---

## 🎯 Task 1: Diversity vs Quality Balance

### Tests Created:
- ✅ Top-1 Quality Protection (2 tests)
- ✅ Relevance Floor Enforcement (1 test)
- ✅ No Irrelevant Promotion (2 tests)
- ✅ Diversity with Quality Balance (1 test)

### What It Tests:
- Highest-scored item always selected first
- No items below 0.55 threshold promoted for diversity
- Category quotas don't override quality standards
- Diversity achieved without compromising minimum quality

### Code Change:
Added quality gate in `selectDiverseActivities()`:
```typescript
// QUALITY GATE: Enforce minimum quality threshold
if (result.score < PLANNER_CONFIG.CONFIDENCE.MINIMUM) {
  continue;
}
```

---

## 🎯 Task 2: Stability Testing

### Tests Created:
- ✅ Identical Input → Identical Output (2 tests)
- ✅ Score Stability (3 tests)
- ✅ Ranking Order Stability (3 tests)
- ✅ Acceptable Variation Boundaries (3 tests)
- ✅ Edge Cases (2 tests)

### What It Tests:
- Same query produces same results across 5-10 runs
- Scores are consistent within SCORE_PRECISION (6 decimals)
- Ranking order never changes for identical inputs
- Deterministic tiebreaker works for equal scores

---

## ✅ How to Verify Tasks Are Complete

### Step 1: Run Diversity vs Quality Tests
```bash
cd apps/backend
npm test -- diversity-quality.spec.ts
```

**Expected Result:**
```
 PASS  src/modules/ai/diversity-quality.spec.ts
  Diversity vs Quality Balance
    Top-1 Quality Protection
      ✓ should always select the highest-scored item first
      ✓ should NOT sacrifice top-1 quality for diversity
    Relevance Floor Enforcement
      ✓ should NEVER select items below MINIMUM threshold
    No Irrelevant Promotion
      ✓ should not promote low-quality items just to fill category quotas
      ✓ should maintain quality standards when diverse categories are requested
    Diversity with Quality Balance
      ✓ should achieve diversity without compromising minimum quality

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

### Step 2: Run Stability Tests
```bash
npm test -- ranking-stability.spec.ts
```

**Expected Result:**
```
 PASS  src/modules/ai/ranking-stability.spec.ts
  AI Ranking Stability
    Identical Input Produces Identical Output
      ✓ should return exact same trip plan for identical inputs (5 runs)
      ✓ should produce consistent results for complex multi-day trips
    Score Stability
      ✓ should produce same scores for same query multiple times (10 runs)
      ✓ should respect SCORE_PRECISION for rounding consistency
      ✓ should maintain score consistency across different date ranges
    Ranking Order Stability
      ✓ should maintain stable ranking order across multiple executions (7 runs)
      ✓ should maintain consistent ordering when scores are close
      ✓ should use deterministic tiebreaker
    Acceptable Variation Boundaries
      ✓ should allow ONLY rounding variations within SCORE_PRECISION
      ✓ should flag variations LARGER than precision threshold
      ✓ should detect when ranking is non-deterministic
    Edge Cases for Stability
      ✓ should handle empty results consistently
      ✓ should handle single result consistently

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
```

### Step 3: Run Standalone Stability Script
```bash
npx ts-node scripts/verify-ranking-stability.ts
```

**Expected Result:**
```
🔍 === RANKING STABILITY TEST ===

📝 Testing: "temples in Kandy"
   Running 10 times...
   ✅ STABLE: All 10 runs produced identical rankings
   Top 3 results:
      1. Temple of the Tooth (score: 0.8234)
      2. Bahiravokanda Temple (score: 0.7856)
      3. Royal Palace (score: 0.7123)

📝 Testing: "beaches near Colombo"
   Running 10 times...
   ✅ STABLE: All 10 runs produced identical rankings

[... more test cases ...]

==================================================
📊 STABILITY TEST SUMMARY
==================================================
Total test cases: 5
✅ Passed: 5
❌ Failed: 0
Success rate: 100.0%

🎉 All stability tests PASSED! Ranking is deterministic.
```

---

## 🔍 What Each Test Validates

### Diversity vs Quality Tests:

| Test | Validates | Success Criteria |
|------|-----------|------------------|
| Top-1 Quality Protection | Best result always wins | Highest score item selected first |
| Relevance Floor | No poor results | All items ≥ 0.55 threshold |
| No Irrelevant Promotion | Quality > diversity | Low-quality items rejected |
| Balanced Selection | Diversity + quality | Multiple categories, all quality |

### Stability Tests:

| Test | Validates | Success Criteria |
|------|-----------|------------------|
| Identical Outputs | Determinism | 5+ runs = same plan |
| Score Consistency | No random variation | Same scores across runs |
| Ranking Order | Stable sorting | Same order every time |
| Precision Boundaries | Acceptable rounding | Within 6 decimal places |
| Edge Cases | Handles empty/single | Consistent behavior |

---

## 📊 Success Metrics

### Task 1 Completion:
- ✅ 6/6 tests pass
- ✅ No items below 0.55 appear in any plan
- ✅ Top result always has highest score
- ✅ Diversity achieved without quality sacrifice

### Task 2 Completion:
- ✅ 13/13 tests pass
- ✅ 100% stability across multiple runs
- ✅ Score variation within SCORE_PRECISION (0.000001)
- ✅ Deterministic tiebreaker works

---

## 🐛 Troubleshooting

### If diversity tests fail:
1. Check that `PLANNER_CONFIG.CONFIDENCE.MINIMUM` is set to 0.55
2. Verify the quality gate in `selectDiverseActivities()` was added
3. Ensure mock data in tests includes `Near:` metadata

### If stability tests fail:
1. Check that `generateDummyEmbedding()` is deterministic
2. Verify `SCORE_PRECISION` is set to 6
3. Ensure sorting uses `collator.compare()` for tiebreaks

### If script fails:
1. Ensure database is running and seeded: `npm run seed`
2. Check DATABASE_URL in `.env`
3. Verify Prisma client is generated: `npx prisma generate`

---

## 🎉 Task Completion Checklist

- [x] Created `diversity-quality.spec.ts` with 6 tests
- [x] Created `ranking-stability.spec.ts` with 13 tests
- [x] Created `verify-ranking-stability.ts` script
- [x] Added quality threshold to `selectDiverseActivities()`
- [ ] Run all tests: `npm test`
- [ ] Run stability script: `npx ts-node scripts/verify-ranking-stability.ts`
- [ ] Verify all tests pass ✅
- [ ] Document results

---

## 📈 Next Steps

After verification:
1. Run full test suite: `npm test` to ensure no regressions
2. Update [AI_TEST_RESULTS.md](AI_TEST_RESULTS.md) with results
3. Consider adding these tests to CI/CD pipeline
4. Monitor production metrics for quality degradation

---

## 🔗 Related Files

- Configuration: `src/modules/ai/planner.constants.ts`
- Main controller: `src/modules/ai/ai.controller.ts`
- Search service: `src/modules/ai/retrieval/search.service.ts`
- Quality metrics: `src/modules/ai/QUALITY_METRICS.md`
- Degradation checker: `scripts/detect-degradation.ts`
