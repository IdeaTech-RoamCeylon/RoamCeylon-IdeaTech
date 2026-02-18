//RoamCeylon\src\types\feedback.types.ts
/**
 * Raw user feedback for a trip
 */
export interface PlannerFeedback {
  id: number;
  userId: string;
  tripId: string;
  feedbackValue: number; 
  createdAt: string;
}

/**
 * Category-level learned weight per user
 */
export interface UserCategoryWeight {
  id: number;
  userId: string;
  category: string;
  weight: number;          // multiplier applied to ranking
  feedbackCount: number;   // how many feedbacks contributed
  lastUpdated: string;
}

/**
 * Overall confidence / trust signals per user
 */
export interface UserFeedbackSignal {
  id: number;
  userId: string;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  trustScore: number;      // 0-1
  updatedAt: string;
}


// export interface FeedbackValue {
//   overallRating: 1 | 2 | 3 | 4 | 5;
//   likedCategories?: string[];
//   dislikedCategories?: string[];
//   likedActivities?: string[];
//   dislikedActivities?: string[];
// }

// export type FeedbackType =
//   | 'liked'
//   | 'disliked'
//   | 'irrelevant'
//   | 'too_generic'
//   | 'perfect_match';

// export interface ActivityFeedback {
//   tripId: string;
//   activityId: string;
//   category: string;
//   region?: string;
//   feedbackType: FeedbackType;
// }

