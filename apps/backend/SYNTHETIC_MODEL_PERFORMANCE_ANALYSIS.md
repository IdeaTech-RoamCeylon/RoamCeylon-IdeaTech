# Synthetic Model Performance Analysis

Date: 2026-04-06  
Scope: First ML-oriented recommendation baseline trained from synthetic data, evaluated against Month 2 baseline and Day 57 quality reports.

## Data Sources Used

1. `src/modules/ai/AI_QUALITY_EVALUATION_REPORT.md`
2. `src/modules/ai/PERFORMANCE_BENCHMARK_REPORT.md`
3. `src/modules/ai/DAY_57_SUMMARY.md`
4. `scripts/generate-synthetic-training-dataset.ts`

## 1. Which Recommendations Improved

All tracked recommendation quality signals improved versus the baseline.

| Metric | Baseline | Current | Change | Interpretation |
|---|---:|---:|---:|---|
| Avg Latency | 1200 ms | 1150 ms | +4.2% faster | Recommendations are returned faster |
| P95 Latency | 2400 ms | 2380 ms | +0.8% faster | Tail latency improved slightly |
| Confidence Score | 0.70 | 0.785 | +12.1% | Ranking confidence increased |
| Diversity Score | 0.75 | 0.880 | +17.3% | Better category mix in plans |
| Preferences Matched | 1.8 | 2.4 | +33.3% | Better personalization |
| Quality Pass Rate (non-generic) | 65% | 89% | +36.9% | Higher recommendation explanation quality |
| Timing Reference Coverage | 72% | 91% | +26.4% | More actionable itinerary context |
| Ranking Stability | 85% | 100% | +17.6% | Deterministic ranking behavior |

### Improvement Summary

- Recommendation relevance improved through stronger preference alignment.
- Recommendation diversity improved through category-penalty controls.
- Recommendation clarity improved through reduced generic phrasing and better timing references.
- System-level reliability improved through deterministic scoring and stable latency.

## 2. Which Recommendations Got Worse

No explicit metric regression was found in the tracked baseline-to-current report.

### Important nuance

- Some gains are modest in tail latency (+0.8% P95), so this area is improved but still sensitive to load changes.
- The report format does not show per-segment regression slices (for example, by destination type or user cohort), so hidden regressions may still exist in untracked subgroups.

## 3. Where the Model Still Struggles

### A. Urban concentration edge cases

- Documented edge-case examples show lower confidence and lower diversity for dense urban destinations with overlapping activity types.
- Typical symptom: recommendation lists skew toward similar categories even when user preference breadth is wider.

### B. Synthetic-data realism gap

From `generate-synthetic-training-dataset.ts`:

- User behavior generation is rule-based and simplified.
- Event labels are heavily tied to synthetic alignment and engagement rules.
- Limited category and behavior complexity can overstate model confidence in controlled tests.

Impact:

- Offline gains may not fully transfer to real-world traffic distributions.
- Model may underperform on nuanced intent combinations not represented in synthetic generation rules.

### C. Cold-start and sparse-profile sensitivity

- Low-history users have weaker behavioral signal support.
- Even with caps and safeguards, personalization depth is naturally lower when profile evidence is thin.

### D. Segment observability gaps

- Current reports are strong on aggregate metrics but weak on fine-grained cohort breakdowns.
- Without destination-segment and user-segment metrics, failures can hide behind positive global averages.

## Final Assessment

The first synthetic-trained model iteration is a net improvement across all measured recommendation KPIs. No direct regression is visible in aggregate metrics. The main remaining risk is not global quality decline, but generalization limits: urban-edge diversity issues, synthetic-to-real mismatch, and sparse-profile performance.

## Recommended Next Validation Steps

1. Add cohort-level evaluation slices (urban vs rural, new vs returning users, narrow vs broad preferences).
2. Add production shadow evaluation on real traffic before changing ranking weights again.
3. Expand synthetic generator behavior realism (intent noise, mixed-motive clicks, seasonal drift patterns).
4. Track Precision@K and Recall@K on real feedback labels once enough live signal is collected.
