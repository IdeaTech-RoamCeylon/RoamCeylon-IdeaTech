# AI Quality Evaluation — Quick Start Guide

This guide explains how to use the AI quality evaluation tools to validate system performance and maintain the Month 3 freeze baseline.

---

## 🚀 Running the Evaluation

### Prerequisites
```bash
cd apps/backend
npm install
```

### Run Full Evaluation (50-100 requests)
```bash
npx tsx scripts/ai-quality-evaluation.ts
```

**What it does:**
- Generates 75 diverse planner requests
- Measures latency, confidence, diversity, preference matching
- Compares results to Month 2 baseline
- Outputs comprehensive report to console
- Saves detailed JSON results

**Expected runtime:** ~15-20 minutes (with 100ms rate limiting between requests)

---

## 📊 Understanding the Output

### Console Report Structure

```
================================================================================
📊 AI QUALITY EVALUATION REPORT — Month 3, Day 57
================================================================================

📈 EXECUTION SUMMARY
   Total Requests: 75
   Successful: 75 (100.0%)
   Failed: 0

⚡ PERFORMANCE METRICS
   Avg Latency: 1150ms
   P95 Latency: 2380ms
   Min Latency: 820ms
   Max Latency: 1980ms

😊 SATISFACTION SIGNALS
   Avg Confidence Score: 0.785
   Avg Diversity Score: 0.880
   Avg Preferences Matched: 2.4
   Avg Activities per Plan: 6.1

✅ QUALITY METRICS
   No Generic Phrases: 89.0%
   Has Timing References: 91.0%
   Category Diversity: 88.0%

📊 COMPARISON TO MONTH 2 BASELINE
   Latency: ✅ Improved by 4.2%
   Stability: ✅ Improved by 12.1%
   Diversity: ✅ Improved by 17.3%

🎯 TARGET COMPLIANCE
   ✅ Avg Latency < 1550ms
   ✅ P95 Latency < 3050ms
   ✅ Confidence > 0.70
   ✅ Diversity > 0.80

================================================================================
✅ ALL TARGETS MET — READY FOR FREEZE
================================================================================
```

---

## 🔍 Interpreting Results

### Success Criteria

| Metric | Target | Interpretation |
|--------|--------|----------------|
| **Avg Latency** | < 1,550ms | Response time for typical request |
| **P95 Latency** | < 3,050ms | 95% of requests complete within this time |
| **Confidence Score** | > 0.70 | Average ranking quality (0-1 scale) |
| **Diversity Score** | > 0.80 | Variety of activity categories (0-1 scale) |
| **Preference Matching** | > 2.0 | Number of user preferences satisfied |

### Quality Indicators

| Indicator | Target | Good Sign |
|-----------|--------|-----------|
| **No Generic Phrases** | > 75% | Plans have specific, actionable descriptions |
| **Timing References** | > 80% | Plans include time-of-day guidance |
| **Category Diversity** | > 80% | Activities span multiple categories |

---

## 🚨 Troubleshooting

### All Requests Failing
**Symptom:** `Failed: 75 (100%)`  
**Cause:** Backend server not running or API endpoint unreachable  
**Fix:**
```bash
# Start backend server
cd apps/backend
npm run start:dev
```

### High Latency
**Symptom:** `Avg Latency: 3500ms` (above target)  
**Possible Causes:**
1. Database connection slow
2. Vector search index degraded
3. High server load
**Fix:**
```bash
# Check database
npx tsx scripts/check-db-health.ts

# Rebuild vector index if needed
npm run seed:embeddings
```

### Low Confidence Scores
**Symptom:** `Avg Confidence Score: 0.55` (below target)  
**Possible Causes:**
1. Poor quality embeddings
2. Outdated attraction data
3. Learning caps too restrictive
**Fix:**
1. Re-seed embeddings with updated data
2. Review planner constants in `planner.constants.ts`
3. Check for database schema drift

### Low Diversity Scores
**Symptom:** `Avg Diversity Score: 0.65` (below target)  
**Possible Causes:**
1. Category penalty not working
2. Limited attraction variety in database
3. Preferences too narrow
**Fix:**
1. Verify `CATEGORY_DIVISOR: 4` in `planner.constants.ts`
2. Add more diverse attractions to database
3. Test with broader preference sets

---

## 📅 When to Run Evaluations

### Required
- **Before any freeze:** Validate system meets all targets
- **After major changes:** Ensure no regressions introduced
- **Monthly:** Track long-term performance trends

### Recommended
- **Weekly:** Quick health check during active development
- **Before production deployments:** Final validation
- **After data updates:** Verify embedding quality

---

## 🔧 Customizing the Evaluation

### Modify Test Scenarios
Edit `TEST_SCENARIOS` in [`ai-quality-evaluation.ts`](../../../scripts/ai-quality-evaluation.ts):

```typescript
const TEST_SCENARIOS = [
  { destination: 'Kandy', days: 3, preferences: ['culture', 'history'] },
  { destination: 'Ella', days: 2, preferences: ['nature', 'hiking'] },
  // Add your scenarios here
];
```

### Adjust Request Count
Change `runsPerScenario` in the `main()` function:

```typescript
const runsPerScenario = Math.ceil(100 / TEST_SCENARIOS.length); // Target 100 requests
```

### Update Baselines
Edit `MONTH_2_BASELINE` to compare against different targets:

```typescript
const MONTH_2_BASELINE = {
  avgLatency: 1200,
  p95Latency: 2400,
  feedbackPositivity: 0.70,
  rankingStability: 0.85,
  diversityScore: 0.75,
};
```

---

## 📝 Generating Reports

### Console Output
Automatically printed to terminal after evaluation completes.

### JSON Export
Saved to `ai-evaluation-{timestamp}.json` in the backend directory.

**Use for:**
- Detailed analysis
- Historical comparisons
- Dashboard visualizations
- Automated monitoring

---

## 🔒 Freeze Compliance Check

After running evaluation, verify frozen parameters haven't changed:

```bash
npx tsx scripts/check-schema-freeze.ts
```

**Expected output:**
```
✅ All frozen parameters verified
✅ No unauthorized changes detected
```

---

## 📚 Related Files

- **Evaluation Script:** [`scripts/ai-quality-evaluation.ts`](../../../scripts/ai-quality-evaluation.ts)
- **Frozen Parameters:** [`src/modules/ai/MONTH_3_SYSTEM_FREEZE.md`](./MONTH_3_SYSTEM_FREEZE.md)
- **Evaluation Report:** [`src/modules/ai/AI_QUALITY_EVALUATION_REPORT.md`](./AI_QUALITY_EVALUATION_REPORT.md)
- **Constants:** [`src/modules/ai/planner.constants.ts`](./planner.constants.ts)
- **Drift Detection:** [`scripts/monitor-trends.ts`](../../../scripts/monitor-trends.ts)

---

## 💡 Tips

1. **Run during off-peak hours** to get cleaner latency measurements
2. **Use production-like data** for realistic results
3. **Save JSON reports** for long-term trend analysis
4. **Compare against historical runs** to detect gradual drift
5. **Document any failures** for root cause analysis

---

**For questions or issues, contact the AI Backend Squad.**
