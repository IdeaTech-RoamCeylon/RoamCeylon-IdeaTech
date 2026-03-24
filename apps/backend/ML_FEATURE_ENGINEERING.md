# Machine Learning Feature Engineering Plan
**Phase:** Month 4 - ML Transition Architecture

## 1. Feature Engineering Planning
To transition from static rule-based heuristics to a predictive Machine Learning ranking model, we must extract raw relational database records and transform them into a normalized feature matrix. 

---

## 2. Defined ML Features & Calculation Logic

### A. User Features (User State)
* **`preferred_categories`** * **Type:** `Numeric Vector Array` (e.g., `[0.8, 0.2, 0.5, 0.0, 0.1]`)
  * **Calculation:** Query the `UserCategoryWeight` table for the user. Apply Min-Max scaling to the raw weights so every category falls between `0.0` and `1.0`. Missing categories default to `0.0`.
* **`feedback_positivity_rate`** * **Type:** `Normalized Float` (Range: `0.0` - `1.0`)
  * **Calculation:** `COUNT(feedback.rating >= 4) / COUNT(total_user_feedback)`. If a user has no feedback history, default to the global average (`0.75`).
* **`travel_pace_preference`** * **Type:** `Ordinal Integer` (`0`, `1`, `2`)
  * **Calculation:** Mapped directly from the user's profile settings enum: `RELAXED` = 0, `MODERATE` = 1, `PACKED` = 2.

### B. Destination Features (Item State)
* **`popularity_score`** * **Type:** `Normalized Float` (Range: `0.0` - `1.0`)
  * **Calculation:** Count how many times this `destination_id` exists in finalized user trips. Divide that by the highest count of any single destination on the platform (Max Absolute Scaling).
* **`category_type`** * **Type:** `One-Hot Encoded Vector` 
  * **Calculation:** Convert the string (e.g., "Culture") into a binary array to prevent the ML model from assuming alphabetical hierarchy. Example: `Culture` = `[1, 0, 0, 0]`, `Nature` = `[0, 1, 0, 0]`.
* **`aggregate_feedback_rating`** * **Type:** `Continuous Float` (Range: `1.0` - `5.0`)
  * **Calculation:** `AVG(feedback.rating)` grouped by `destination_id`. Apply a Bayesian average to penalize places with fewer than 5 total reviews.

### C. Interaction Features (Contextual/Behavioral State)
* **`click_frequency`** * **Type:** `Integer`
  * **Calculation:** Queried from the app's analytics/event tracking table. Total count of 'DESTINATION_CARD_CLICK' events where `user_id` and `destination_id` match.
* **`trip_selection_rate`** * **Type:** `Normalized Float` (Range: `0.0` - `1.0`)
  * **Calculation:** `(Times kept in final itinerary) / (Times suggested by AI)`. If the AI suggests it 10 times but the user swaps/deletes it 8 times, the score is `0.20`.