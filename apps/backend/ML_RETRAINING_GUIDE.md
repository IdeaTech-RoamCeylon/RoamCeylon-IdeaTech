# ML Model Retraining & Comparison Guide

## Overview

This guide explains how to retrain the recommendation ML model (Model v2) using new feedback data and compare it against the current production model (Model v1).

---

## Tasks Completed

### ✅ Task 1: Retrain ML Model with New Feedback Data

**Script**: `scripts/collect-training-data.ts` + `scripts/retrain_model_v2.py`

**What it does:**
- Collects new feedback from the live database:
  - User behavior events (clicks, views, saves)
  - Planner feedback ratings (1-5 stars)
  - Updated user interest profiles (cultural/adventure/relaxation scores)
  - Recommendation logs with engagement signals
  - User category weights and preferences
  
- Engineers features with new signals:
  - Feedback positivity rate
  - Strong engagement counts
  - Ignored recommendation tracking
  - Recency-based weighting
  
- Trains improved Model v2 using:
  - HistGradientBoostingClassifier with better regularization
  - GroupKFold cross-validation (prevents user data leakage)
  - Lower learning rate (0.05) for better generalization
  - Increased L2 regularization (0.1) to reduce overfitting
  - Early stopping with validation monitoring

**Outputs:**
- `data/training/ml_training_dataset_v2_YYYY-MM-DD.csv` — New training data with feedback signals
- `data/training/roamceylon_recommendation_model_v2.pkl` — Trained Model v2
- `data/training/scaler_v2.pkl` — Feature scaler for v2
- `data/training/model_v2_metadata.json` — Model metadata and hyperparameters

---

### ✅ Task 2: Compare Model Versions (v1 vs v2)

**Script**: `scripts/compare-model-versions.ts`

**Metrics Compared:**

1. **CTR (Click-Through Rate)**
   - Measures: Percentage of shown recommendations that users clicked
   - Formula: `(clicks / total_recommendations) * 100`
   - Higher is better
   - Source: RecommendationLog table

2. **Feedback Positivity**
   - Measures: Percentage of user ratings ≥ 4 out of 5
   - Formula: `(positive_ratings / total_ratings) * 100`
   - Higher is better
   - Source: PlannerFeedback table

3. **Diversity Score**
   - Measures: Variety of categories in recommendations (0-100)
   - Calculation: Shannon entropy of recommended categories, normalized
   - Higher is better (80+ = very diverse)
   - Source: DestinationCategoryScore + RecommendationLog

**Output:**
- `MODEL_COMPARISON_REPORT_YYYY-MM-DD.json` — Detailed comparison with:
  - Side-by-side metrics (v1 vs v2)
  - Improvement percentages
  - Per-metric winner
  - Overall recommendation (deploy v2 if 2+ metrics win)
  - Raw data for each metric

---

## Getting Started

### Option A: Run Full ML Pipeline (Recommended)

Run all steps in sequence: collect data → retrain model → compare versions

```bash
npm run ml:full-pipeline
```

This command:
1. Collects new training data from database
2. Trains Model v2 with improved hyperparameters
3. Compares v1 vs v2 and generates report

**Time to complete**: 5-10 minutes (depending on database size)

---

### Option B: Run Steps Individually

#### Step 1: Collect New Training Data

```bash
npm run collect:training-data
```

**What to expect:**
- Queries live database tables:
  - UserBehaviorEvent (5,000 recent records)
  - PlannerFeedback (1,000 recent ratings)
  - UserInterestProfile (2,000 profiles)
  - RecommendationLog (10,000 recent recommendations)
  - UserCategoryWeight, DestinationCategoryScore
  
- Output: CSV file with new training data

**Example output:**
```
[COLLECT-DATA] Starting training data collection from live DB...
[1/6] Fetching user behavior events...
  ✓ Found 5000 behavior events
[2/6] Fetching planner feedback ratings...
  ✓ Found 987 feedback ratings
[3/6] Fetching user interest profiles...
  ✓ Found 1843 user profiles
...
✅ Data collection complete!
📊 Data Summary:
   - Total training records: 4532
   - Positive labels (clicked): 1205 (26.6%)
   - Negative labels (ignored): 3327 (73.4%)
   - Unique users: 342
   - Unique destinations: 187
```

---

#### Step 2: Retrain Model v2

```bash
npm run retrain:model-v2
```

**What to expect:**
- Loads latest training data (v2 CSV)
- Prepares features (30+ engineered features)
- Trains HistGradientBoosting classifier with:
  - 5-fold GroupKFold cross-validation
  - Early stopping enabled
  - Validation monitoring

**Example output:**
```
============================================================
RETRAIN ML MODEL - MODEL v2
Using: New feedback data + User behavior signals + Updated features
============================================================

[1/6] Loading training data with new feedback signals...
  ✓ Loaded 4532 records

[2/6] Engineering features...
  ✓ Features: 14
  ✓ Positive class: 1205 (26.6%)
  ✓ Negative class: 3327 (73.4%)

[3/6] Training Model v2 (HistGradientBoosting)...
  Fold 1: train=3625, val=907
    Precision: 0.735, Recall: 0.418, F1: 0.531, AUC: 0.824

[4/6] Generating evaluation report...
  ✓ Precision: 0.735
  ✓ Recall: 0.418
  ✓ F1-Score: 0.531
  ✓ AUC-ROC: 0.824

[5/6] Saving Model v2...
  ✓ Model saved: data/training/roamceylon_recommendation_model_v2.pkl
  ✓ Scaler saved: data/training/scaler_v2.pkl
  ✓ Metadata saved: data/training/model_v2_metadata.json

[6/6] Training Complete! 📊

============================================================
MODEL v2 TRAINING SUMMARY
============================================================
Model Type: HistGradientBoostingClassifier
Training Date: 2026-04-09 14:23:45

Evaluation Metrics:
  Precision: 0.735
  Recall: 0.418
  F1-Score: 0.531
  AUC-ROC: 0.824

Model Artifacts:
  Model: data/training/roamceylon_recommendation_model_v2.pkl
  Scaler: data/training/scaler_v2.pkl
  Metadata: data/training/model_v2_metadata.json
============================================================

✅ Model v2 ready for comparison!
```

---

#### Step 3: Compare Model Versions

```bash
npm run compare:model-versions
```

**What to expect:**
- Analyzes recommendation performance (CTR)
- Calculates feedback positivity from user ratings
- Computes diversity score from recommendation categories
- Generates comparison report

**Example output:**
```
======================================================================
MODEL COMPARISON: v1 vs v2
Metrics: CTR | Feedback Positivity | Diversity Score
======================================================================

[1/4] Collecting CTR metrics...
  📊 Computing CTR (Click-Through Rate)...
  ✓ CTR: 4.85% (242/5000 clicks)

[2/4] Collecting Feedback Positivity metrics...
  📊 Computing Feedback Positivity Rate...
  ✓ Positivity Rate: 64.32% (636/987 positive)
  ✓ Average Rating: 4.12/5

[3/4] Collecting Diversity Score metrics...
  📊 Computing Diversity Score...
  ✓ Diversity Score: 78.45/100
  ✓ Shannon Entropy: 2.812 (max: 3.542)
  ✓ Unique Categories: 11

[4/4] Computing model performance deltas...

======================================================================
RESULTS
======================================================================

Metric                         v1         v2         Change         Winner
----------------------------------------------------------------------
CTR (Click-Through Rate %)     4.20       4.85       +15.5%         🎯 v2
Feedback Positivity (%)        58.50      64.32      +9.9%          🎯 v2
Diversity Score (/100)         72.30      78.45      +8.5%          🎯 v2

======================================================================
SUMMARY
======================================================================

Model v2 Wins: 3/3 metrics

✅ RECOMMEND: Deploy Model v2 (superior performance across all metrics)

📄 Full report saved: MODEL_COMPARISON_REPORT_2026-04-09.json
```

---

## Understanding the Results

### CTR Improvement Example
- **v1 CTR**: 4.20%
- **v2 CTR**: 4.85%
- **Change**: +15.5% relative improvement
- **Interpretation**: Users click on v2 recommendations 15.5% more often

### Feedback Positivity Example
- **v1 Positivity**: 58.50%
- **v2 Positivity**: 64.32%
- **Change**: +9.9% improvement
- **Interpretation**: v2 recommendations receive higher user satisfaction ratings

### Diversity Score Example
- **v1 Diversity**: 72.30/100
- **v2 Diversity**: 78.45/100
- **Change**: +8.5% improvement
- **Interpretation**: v2 shows more category variety (less repetitive)

### Overall Decision
- **✅ Deploy v2**: Wins on 2+ metrics
- **⚠️ Hold v2**: Wins on <2 metrics (needs more tuning)
- **❌ Rollback**: v1 clearly better

---

## Data Sources

### Training Data (What's Collected)

| Source Table | Records | Features |
|---|---|---|
| **UserBehaviorEvent** | 5,000 | event_type, item_id, metadata, created_at |
| **PlannerFeedback** | 1,000 | userId, feedbackValue (1-5), createdAt |
| **UserInterestProfile** | 2,000 | cultural_score, adventure_score, relaxation_score, diversity |
| **RecommendationLog** | 10,000 | ml_score, clicked status, source (ML/rule-based) |
| **UserCategoryWeight** | - | userId, category, weight (preference scalar) |
| **DestinationCategoryScore** | - | destination_id, popularity_score, frequency_score |

### Feature Engineering

**User Features (from UserInterestProfile):**
- cultural_score, adventure_score, relaxation_score
- category_diversity, booking_conversion_rate
- travel_pace_preference, time_of_day_preference

**Destination Features (from DestinationCategoryScore + RecommendationLog):**
- popularity_score, frequency_score
- category affinity matches

**Engagement Features (from UserBehaviorEvent + RecommendationLog):**
- click_frequency, feedback_positivity_rate
- engagement_recency (days since last interaction)
- strong_engagement_count, ignored_recs_count

**Context Features:**
- ml_score, rule_score from previous recommendation
- source (ML vs rule-based)

---

## Model Hyperparameters (v2)

```python
Model Type: HistGradientBoostingClassifier

Hyperparameters:
  learning_rate: 0.05          # Lower LR for stability
  max_iter: 500                # More training iterations
  max_depth: 7                 # Depth control
  l2_regularization: 0.1       # L2 penalty (increased)
  max_bins: 255                # Categorical bin count
  early_stopping: True         # Stop on validation plateau
  validation_fraction: 0.1     # 10% validation set
  n_iter_no_change: 20         # Stop after 20 iters no improvement

Cross-Validation: GroupKFold (5 folds)
  - Prevents user data leakage
  - Ensures groups (users) not split across train/val
```

---

## Troubleshooting

### Issue: "Database connection failed"
**Solution**: Ensure PostgreSQL is running and `DATABASE_URL` env var is set
```bash
echo $DATABASE_URL  # Check connection string
```

### Issue: "Python module not found"
**Solution**: Install required packages
```bash
cd apps/backend
pip install pandas numpy scikit-learn joblib
```

### Issue: "Model v2 metadata not found"
**Solution**: Re-run training step to regenerate
```bash
npm run retrain:model-v2
```

### Issue: "Comparison report shows null values"
**Solution**: Ensure recommendation and feedback data exists in database
```bash
# Check data availability
npm run test:e2e  # Verify database has test data
```

---

## Next Steps

### If v2 Wins (Deploy)
1. Backup current model: `cp data/training/roamceylon_recommendation_model_tuned.pkl data/training/roamceylon_recommendation_model_v1_backup.pkl`
2. Update runtime service to load v2:
   ```typescript
   // In mlPrediction.service.ts
   const model = joblib.load('data/training/roamceylon_recommendation_model_v2.pkl');
   ```
3. Restart backend: `npm run start:dev`
4. Monitor metrics: `npm run analyze:hybrid-stability-feedback` (weekly)

### If v2 Shows Mixed Results (Investigate)
1. Check if new training data has quality issues:
   ```bash
   npm run collect:training-data  # Re-collect with logging
   ```
2. Run hyperparameter tuning:
   ```bash
   npm run tune:hyperparameters
   ```
3. Increase training data size (adjust data collection limits)

### Ongoing Monitoring
- Run comparison monthly: `npm run ml:full-pipeline`
- Track metrics: `npm run analyze:hybrid-stability-feedback`
- Archive reports: `MODEL_COMPARISON_REPORT_*.json` in version control

---

## File Structure

```
apps/backend/
├── scripts/
│   ├── collect-training-data.ts         ← Fetch live DB data
│   ├── retrain_model_v2.py              ← Train Model v2
│   ├── compare-model-versions.ts        ← Compare v1 vs v2
│   └── [existing ML scripts...]
├── data/training/
│   ├── roamceylon_recommendation_model_tuned.pkl     ← Model v1
│   ├── roamceylon_recommendation_model_v2.pkl        ← Model v2 (new)
│   ├── model_v2_metadata.json                        ← v2 metadata
│   ├── ml_training_dataset_extended.csv              ← Original data
│   ├── ml_training_dataset_v2_YYYY-MM-DD.csv         ← New data
│   └── [other training artifacts...]
├── package.json                          ← Added new npm scripts
└── [NestJS backend files...]

New npm commands:
  npm run collect:training-data         # Collect new data
  npm run retrain:model-v2              # Train v2 model
  npm run compare:model-versions        # Compare v1 vs v2
  npm run ml:full-pipeline              # Run all 3 steps
```

---

## Summary

✅ **Three automated ML workflows created:**

1. **Data Collection** — Pulls fresh feedback, behavior signals, and user features from live database
2. **Model v2 Training** — Improves upon v1 with better regularization and cross-validation
3. **Comparison Tool** — Evaluates v1 vs v2 on business metrics (CTR, positivity, diversity)

**Key metrics tracked:**
- **CTR (Click-Through Rate)** — How often users engage with recommendations
- **Feedback Positivity** — User satisfaction ratings
- **Diversity Score** — Variety in recommended categories

**To get started:**
```bash
npm run ml:full-pipeline
```

Then review the generated `MODEL_COMPARISON_REPORT_*.json` to decide whether to deploy v2.
