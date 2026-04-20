# Hybrid Ranking Stability Monitoring & Model Feedback Analysis

Date: 2026-04-06

## 1) Hybrid Ranking Stability Monitoring

### Unstable Rankings
- Tested queries: 4
- Unstable queries: 0
- Instability rate: 0.0%
- Status: STABLE

### Category Imbalance
- Positive events analyzed: 2221
- Top category share: 20.5%
- Imbalance rule (top share >= 45%): OK

Top category distribution (positive signals):
- History: 455 (20.5%)
- Nature: 410 (18.5%)
- Culture: 405 (18.2%)
- Beach: 384 (17.3%)
- Sightseeing: 301 (13.6%)
- Adventure: 245 (11.0%)

### Irrelevant Recommendation Proxy
- Ignored recommendations (view + label=0): 779
- Ignored rate (all events): 26.0%
- Low-affinity ignored rate within views: 3.9%
- Status: OK

## 2) Model Feedback Analysis

### User Behavior Signals
- Total events: 3000
- Recommendation clicks (trip_click): 438 (14.6%)
- Strong engagement events (trip_click/save/save_trip/book): 1671 (55.7%)
- Ignored recommendations: 779 (26.0%)
- Positive-label rate: 74.0%
- Average user-item affinity: 0.570

### User Feedback Ratings (DB)
- Valid ratings: 11
- Positive (>=4): 7 (63.6%)
- Neutral (=3): 0
- Negative (<=2): 4 (36.4%)
- Average rating: 3.55

## Recommended Next Improvements

1. If category imbalance is flagged, raise diversity penalty slightly for over-dominant categories and re-evaluate.
2. If irrelevant proxy is flagged, increase minimum similarity gate for low-confidence contexts.
3. Use click-through and ignored-rate trends weekly as release gates before weight changes.
4. Add cohort slicing (new users vs returning users) to isolate cold-start behavior.
