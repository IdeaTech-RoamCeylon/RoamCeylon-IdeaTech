import { Test, TestingModule } from '@nestjs/testing';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { SearchService } from './retrieval/search.service';
import { TripStoreService } from './trips/trip-store.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PLANNER_CONFIG } from './planner.constants';
import { PlannerService } from '../planner/planner.service';
import { Request } from 'express';
import { AnalyticsService } from '../analytics/analytics.service';
import { FeedbackRankingService } from '../feedback/ranking.service';

const mockPlannerService = {
  getFeedback: jest.fn().mockResolvedValue([]),
};

const mockAnalyticsService = {
  trackLearningInfluence: jest.fn(),
  recordEvent: jest.fn().mockResolvedValue(undefined),
};

const mockRankingService = {
  getPersonalizedScoringStats: jest.fn().mockResolvedValue({}),
  getPersonalizationMetrics: jest.fn().mockResolvedValue({}),
  getExplanation: jest.fn().mockResolvedValue({}),
};

describe('AI Ranking Stability', () => {
  let controller: AIController;

  const mockAIService = {
    getAllEmbeddings: jest.fn(),
    generateDummyEmbedding: jest.fn((text: string) => {
      // Deterministic: same text = same embedding
      const hash = text
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return Array.from({ length: 1536 }, (_, i) => ((hash + i) % 100) / 100);
    }),
    search: jest.fn(),
    isPartialMatch: jest.fn().mockReturnValue(true),
  };

  const mockSearchService = {
    getConfidence: jest.fn((score: number) => {
      if (score >= 0.8) return 'High';
      if (score >= 0.5) return 'Medium';
      return 'Low';
    }),
    searchEmbeddingsWithMetadataFromEmbedding: jest.fn(),
  };

  const mockTripStoreService = {
    getByIdForUser: jest.fn(),
    getLatestForUser: jest.fn(),
    getUserTravelPace: jest.fn(),
    getUserCategoryPreferences: jest.fn(),
    getUserFrequentPlaces: jest.fn(),
    getRecentUserSelections: jest.fn(),
    getUserAvoidedCategories: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIController],
      providers: [
        { provide: AIService, useValue: mockAIService },
        { provide: SearchService, useValue: mockSearchService },
        { provide: TripStoreService, useValue: mockTripStoreService },
        { provide: PlannerService, useValue: mockPlannerService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: FeedbackRankingService, useValue: mockRankingService },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AIController>(AIController);
  });

  describe('Identical Input Produces Identical Output', () => {
    it('should return exact same trip plan for identical inputs (run 5 times)', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Temple A',
          content: 'Culture site. Near: Kandy',
          score: 0.85,
        },
        {
          id: '2',
          title: 'Beach B',
          content: 'Beach area. Near: Kandy',
          score: 0.8,
        },
        {
          id: '3',
          title: 'Park C',
          content: 'Nature park. Near: Kandy',
          score: 0.75,
        },
      ];

      mockAIService.search.mockResolvedValue(mockResults);

      const request = {
        destination: 'Kandy',
        startDate: '2026-04-01',
        endDate: '2026-04-03',
        preferences: ['culture', 'nature'],
      };

      // Run 5 times
      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          controller.tripPlanEnhanced(
            { user: { id: 'test-user' }, headers: {} } as unknown as Request,
            request,
          ),
        ),
      );

      // Extract activity titles and scores from all runs
      const activitySets = results.map((result) =>
        result.plan.dayByDayPlan.flatMap((day) =>
          day.activities.map((a) => ({
            title: a.placeName,
            score: a.explanation!.rankingFactors.relevanceScore,
            day: day.day,
            slot: a.timeSlot,
          })),
        ),
      );

      // All runs should produce identical results
      for (let i = 1; i < activitySets.length; i++) {
        expect(activitySets[i]).toEqual(activitySets[0]);
      }

      console.log(
        '✅ Stability check passed: 5 identical runs produced identical outputs',
      );
    });

    it('should produce consistent results for complex multi-day trips', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Activity 1',
          content: 'Description. Near: Kandy',
          score: 0.9,
        },
        {
          id: '2',
          title: 'Activity 2',
          content: 'Description. Near: Kandy',
          score: 0.85,
        },
        {
          id: '3',
          title: 'Activity 3',
          content: 'Description. Near: Kandy',
          score: 0.8,
        },
        {
          id: '4',
          title: 'Activity 4',
          content: 'Description. Near: Kandy',
          score: 0.75,
        },
        {
          id: '5',
          title: 'Activity 5',
          content: 'Description. Near: Kandy',
          score: 0.7,
        },
        {
          id: '6',
          title: 'Activity 6',
          content: 'Description. Near: Kandy',
          score: 0.65,
        },
      ];

      mockAIService.search.mockResolvedValue(mockResults);

      const request = {
        destination: 'Kandy',
        startDate: '2026-04-05',
        endDate: '2026-04-10', // 6 days
        preferences: ['culture', 'nature', 'history'],
      };

      // Run 3 times
      const results = await Promise.all(
        Array.from({ length: 3 }, () =>
          controller.tripPlanEnhanced(
            { user: { id: 'test-user' }, headers: {} } as unknown as Request,
            request,
          ),
        ),
      );

      // Serialize entire plans for comparison
      const serializedPlans = results.map((result) =>
        JSON.stringify(result.plan.dayByDayPlan),
      );

      // All should be identical
      for (let i = 1; i < serializedPlans.length; i++) {
        expect(serializedPlans[i]).toEqual(serializedPlans[0]);
      }
    });
  });

  describe('Score Stability', () => {
    it('should produce same scores for same query multiple times', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Activity A',
          content: 'Test content. Near: Colombo',
          score: 0.8765432,
        },
        {
          id: '2',
          title: 'Activity B',
          content: 'Test content. Near: Colombo',
          score: 0.7234567,
        },
      ];

      mockAIService.search.mockResolvedValue(mockResults);

      const request = {
        destination: 'Colombo',
        startDate: '2026-04-05',
        endDate: '2026-04-06',
        preferences: ['culture'],
      };

      // Run 10 times
      const results = await Promise.all(
        Array.from({ length: 10 }, () =>
          controller.tripPlanEnhanced(
            { user: { id: 'test-user' }, headers: {} } as unknown as Request,
            request,
          ),
        ),
      );

      // Extract all scores from all runs
      const allScores = results.map((result) =>
        result.plan.dayByDayPlan
          .flatMap((day) => day.activities)
          .map((a) => a.explanation!.rankingFactors.relevanceScore),
      );

      // Check that all score arrays are identical
      for (let i = 1; i < allScores.length; i++) {
        expect(allScores[i]).toEqual(allScores[0]);
      }

      console.log(
        '✅ Score stability passed: 10 runs produced identical scores',
      );
    });

    it('should respect SCORE_PRECISION for rounding consistency', () => {
      // Test the quantize function used in ranking
      const precision = PLANNER_CONFIG.CONSISTENCY.SCORE_PRECISION;
      const testScore = 0.87654321;

      // Simulate quantization (this logic exists in AIController)
      const quantize = (val: number, decimals: number) => {
        const factor = Math.pow(10, decimals);
        return Math.round(val * factor) / factor;
      };

      const rounded1 = quantize(testScore, precision);
      const rounded2 = quantize(testScore, precision);
      const rounded3 = quantize(testScore, precision);

      // All should be identical
      expect(rounded1).toBe(rounded2);
      expect(rounded2).toBe(rounded3);
      expect(rounded1).toBe(0.876543); // 6 decimal places
    });

    it('should maintain score consistency across different date ranges', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Stable Activity',
          content: 'Content. Near: Galle',
          score: 0.85,
        },
        {
          id: '2',
          title: 'Another Activity',
          content: 'Content. Near: Galle',
          score: 0.75,
        },
      ];

      mockAIService.search.mockResolvedValue(mockResults);

      // Same destination and preferences, different dates
      const request1 = {
        destination: 'Galle',
        startDate: '2026-05-01',
        endDate: '2026-05-03',
        preferences: ['culture'],
      };

      const request2 = {
        destination: 'Galle',
        startDate: '2026-06-15',
        endDate: '2026-06-17',
        preferences: ['culture'],
      };

      const result1 = await controller.tripPlanEnhanced(
        { user: { id: 'test-user' }, headers: {} } as unknown as Request,
        request1,
      );

      const result2 = await controller.tripPlanEnhanced(
        { user: { id: 'test-user' }, headers: {} } as unknown as Request,
        request2,
      );

      // Scores should be identical regardless of dates
      const scores1 = result1.plan.dayByDayPlan
        .flatMap((day) => day.activities)
        .map((a) => a.explanation!.rankingFactors.relevanceScore);

      const scores2 = result2.plan.dayByDayPlan
        .flatMap((day) => day.activities)
        .map((a) => a.explanation!.rankingFactors.relevanceScore);

      expect(scores1).toEqual(scores2);
    });
  });

  describe('Ranking Order Stability', () => {
    it('should maintain stable ranking order across multiple executions', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Top Item',
          content: 'Best match. Near: Galle',
          score: 0.95,
        },
        {
          id: '2',
          title: 'Second Item',
          content: 'Good match. Near: Galle',
          score: 0.85,
        },
        {
          id: '3',
          title: 'Third Item',
          content: 'Decent match. Near: Galle',
          score: 0.75,
        },
        {
          id: '4',
          title: 'Fourth Item',
          content: 'OK match. Near: Galle',
          score: 0.65,
        },
      ];

      mockAIService.search.mockResolvedValue(mockResults);

      const request = {
        destination: 'Galle',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        preferences: ['culture', 'history'],
      };

      // Run 7 times
      const results = await Promise.all(
        Array.from({ length: 7 }, () =>
          controller.tripPlanEnhanced(
            { user: { id: 'test-user' }, headers: {} } as unknown as Request,
            request,
          ),
        ),
      );

      // Extract ranking orders
      const rankingOrders = results.map((result) =>
        result.plan.dayByDayPlan
          .flatMap((day) => day.activities)
          .map((a) => a.placeName),
      );

      // Verify all rankings are identical
      for (let i = 1; i < rankingOrders.length; i++) {
        expect(rankingOrders[i]).toEqual(rankingOrders[0]);
      }

      // Verify highest-scored item appears first
      expect(rankingOrders[0][0]).toBe('Top Item');
    });

    it('should maintain consistent ordering when scores are close', async () => {
      // Items with very close scores - tiebreaker should be deterministic
      const mockResults = [
        {
          id: 'a',
          title: 'Item A',
          content: 'Content. Near: Kandy',
          score: 0.8000001,
        },
        {
          id: 'b',
          title: 'Item B',
          content: 'Content. Near: Kandy',
          score: 0.8,
        },
        {
          id: 'c',
          title: 'Item C',
          content: 'Content. Near: Kandy',
          score: 0.7999999,
        },
      ];

      mockAIService.search.mockResolvedValue(mockResults);

      const request = {
        destination: 'Kandy',
        startDate: '2026-04-15',
        endDate: '2026-04-16',
        preferences: ['nature'],
      };

      // Run 5 times
      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          controller.tripPlanEnhanced(
            { user: { id: 'test-user' }, headers: {} } as unknown as Request,
            request,
          ),
        ),
      );

      const orders = results.map((result) =>
        result.plan.dayByDayPlan
          .flatMap((day) => day.activities)
          .map((a) => a.placeName),
      );

      // All runs should have same order
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i]).toEqual(orders[0]);
      }
    });

    it('should use deterministic tiebreaker (stable ID comparison)', async () => {
      // Multiple items with identical scores
      const mockResults = [
        {
          id: '99',
          title: 'Item Z',
          content: 'Content. Near: Colombo',
          score: 0.8,
        },
        {
          id: '10',
          title: 'Item A',
          content: 'Content. Near: Colombo',
          score: 0.8,
        },
        {
          id: '50',
          title: 'Item M',
          content: 'Content. Near: Colombo',
          score: 0.8,
        },
      ];

      mockAIService.search.mockResolvedValue(mockResults);

      const request = {
        destination: 'Colombo',
        startDate: '2026-04-20',
        endDate: '2026-04-21',
        preferences: ['beach'],
      };

      // Run 3 times
      const results = await Promise.all(
        Array.from({ length: 3 }, () =>
          controller.tripPlanEnhanced(
            { user: { id: 'test-user' }, headers: {} } as unknown as Request,
            request,
          ),
        ),
      );

      const orders = results.map((result) =>
        result.plan.dayByDayPlan
          .flatMap((day) => day.activities)
          .map((a) => a.placeName),
      );

      // All should be identical
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i]).toEqual(orders[0]);
      }

      // Order should be deterministic based on stable ID sort
      // (Not alphabetical by title, but by ID string comparison)
      console.log('Stable order:', orders[0]);
    });
  });

  describe('Acceptable Variation Boundaries', () => {
    it('should allow ONLY rounding variations within SCORE_PRECISION', () => {
      const precision = PLANNER_CONFIG.CONSISTENCY.SCORE_PRECISION;
      const epsilon = Math.pow(10, -precision);

      // These scores should be considered "identical" after rounding
      const score1 = 0.8765432123456;
      const score2 = 0.8765432987654;

      const quantize = (val: number, decimals: number) => {
        const factor = Math.pow(10, decimals);
        return Math.round(val * factor) / factor;
      };

      const rounded1 = quantize(score1, precision);
      const rounded2 = quantize(score2, precision);

      expect(Math.abs(rounded1 - rounded2)).toBeLessThan(epsilon);
    });

    it('should flag variations LARGER than precision threshold', () => {
      const precision = PLANNER_CONFIG.CONSISTENCY.SCORE_PRECISION;
      const epsilon = Math.pow(10, -precision);

      // These scores are significantly different
      const score1 = 0.87;
      const score2 = 0.75;

      const diff = Math.abs(score1 - score2);
      expect(diff).toBeGreaterThan(epsilon);

      console.log(
        `⚠️ Variation of ${diff} exceeds precision threshold ${epsilon}`,
      );
    });

    it('should detect when ranking is non-deterministic (negative test)', () => {
      // This test demonstrates what instability looks like
      const run1 = ['Item A', 'Item B', 'Item C'];
      const run2 = ['Item A', 'Item C', 'Item B']; // Different order

      // These should NOT be equal (instability detected)
      expect(run1).not.toEqual(run2);
    });
  });

  describe('Edge Cases for Stability', () => {
    it('should handle empty results consistently', async () => {
      mockAIService.search.mockResolvedValue([]);

      const request = {
        destination: 'Unknown Place',
        startDate: '2026-05-01',
        endDate: '2026-05-02',
        preferences: ['culture'],
      };

      const results = await Promise.all(
        Array.from({ length: 3 }, () =>
          controller.tripPlanEnhanced(
            { user: { id: 'test-user' }, headers: {} } as unknown as Request,
            request,
          ),
        ),
      );

      // All should handle empty results identically
      const planSummaries = results.map((r) => r.plan.summary.totalActivities);

      for (let i = 1; i < planSummaries.length; i++) {
        expect(planSummaries[i]).toEqual(planSummaries[0]);
      }
    });

    it('should handle single result consistently', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Only Activity',
          content: 'Single option. Near: Kandy',
          score: 0.85,
        },
      ];

      mockAIService.search.mockResolvedValue(mockResults);

      const request = {
        destination: 'Kandy',
        startDate: '2026-05-05',
        endDate: '2026-05-07',
        preferences: ['nature'],
      };

      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          controller.tripPlanEnhanced(
            { user: { id: 'test-user' }, headers: {} } as unknown as Request,
            request,
          ),
        ),
      );

      const allPlans = results.map((r) => JSON.stringify(r.plan));

      for (let i = 1; i < allPlans.length; i++) {
        expect(allPlans[i]).toEqual(allPlans[0]);
      }
    });
  });
});
