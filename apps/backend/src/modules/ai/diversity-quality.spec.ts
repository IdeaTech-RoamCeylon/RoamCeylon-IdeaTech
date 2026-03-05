import { Test, TestingModule } from '@nestjs/testing';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { SearchService } from './retrieval/search.service';
import { TripStoreService } from './trips/trip-store.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PLANNER_CONFIG } from './planner.constants';
import { Request } from 'express';

describe('Diversity vs Quality Balance', () => {
  let controller: AIController;

  const mockAIService = {
    getAllEmbeddings: jest.fn(),
    generateDummyEmbedding: jest.fn(),
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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIController],
      providers: [
        { provide: AIService, useValue: mockAIService },
        { provide: SearchService, useValue: mockSearchService },
        { provide: TripStoreService, useValue: mockTripStoreService },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AIController>(AIController);
  });

  describe('Top-1 Quality Protection', () => {
    it('should always select the highest-scored item first, regardless of category', async () => {
      // Mock results with clear winner
      const mockResults = [
        {
          id: '1',
          title: 'Best Temple',
          content: 'Amazing cultural site. Near: Kandy. Category: Culture',
          score: 0.95, // HIGHEST
        },
        {
          id: '2',
          title: 'Good Beach',
          content: 'Nice beach. Near: Kandy. Category: Beach',
          score: 0.85,
        },
        {
          id: '3',
          title: 'Another Temple',
          content: 'Another cultural site. Near: Kandy. Category: Culture',
          score: 0.82,
        },
        {
          id: '4',
          title: 'Nature Park',
          content: 'Forest area. Near: Kandy. Category: Nature',
          score: 0.78,
        },
      ];

      mockAIService.search.mockResolvedValue(mockResults);

      const request = {
        destination: 'Kandy',
        startDate: '2026-03-10',
        endDate: '2026-03-12',
        preferences: ['culture', 'nature', 'beach'],
      };

      const result = await controller.tripPlanEnhanced(
        { user: { id: 'test-user' }, headers: {} } as unknown as Request,
        request,
      );

      // Extract all activities from the plan
      const allActivities = result.plan.dayByDayPlan.flatMap(
        (day) => day.activities,
      );

      // The first activity selected should be the highest scored one
      expect(allActivities[0].placeName).toBe('Best Temple');
      expect(allActivities[0].explanation!.rankingFactors.relevanceScore).toBe(
        0.95,
      );
    });

    it('should NOT sacrifice top-1 quality for diversity', async () => {
      // All high-scoring items in same category
      const mockResults = [
        {
          id: '1',
          title: 'Temple A',
          content: 'Excellent temple. Near: Kandy. Category: Culture',
          score: 0.92,
        },
        {
          id: '2',
          title: 'Temple B',
          content: 'Great temple. Near: Kandy. Category: Culture',
          score: 0.89,
        },
        {
          id: '3',
          title: 'Temple C',
          content: 'Good temple. Near: Kandy. Category: Culture',
          score: 0.85,
        },
        {
          id: '4',
          title: 'Random Beach',
          content: 'Beach for diversity. Near: Kandy. Category: Beach',
          score: 0.6, // Lower but different category
        },
      ];

      mockAIService.search.mockResolvedValue(mockResults);

      const request = {
        destination: 'Kandy',
        startDate: '2026-03-10',
        endDate: '2026-03-11',
        preferences: ['culture'],
      };

      const result = await controller.tripPlanEnhanced(
        { user: { id: 'test-user' }, headers: {} } as unknown as Request,
        request,
      );

      const allActivities = result.plan.dayByDayPlan.flatMap(
        (day) => day.activities,
      );

      // Top result should still be selected
      expect(allActivities[0].placeName).toBe('Temple A');

      // All selected items should be above MINIMUM threshold
      allActivities.forEach((activity) => {
        expect(
          activity.explanation!.rankingFactors.relevanceScore,
        ).toBeGreaterThanOrEqual(PLANNER_CONFIG.CONFIDENCE.MINIMUM);
      });
    });
  });

  describe('Relevance Floor Enforcement', () => {
    it('should NEVER select items below MINIMUM threshold (0.55) even for diversity', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Good Activity',
          content: 'High quality. Near: Colombo. Category: Culture',
          score: 0.88,
        },
        {
          id: '2',
          title: 'Mediocre Activity',
          content: 'Average. Near: Colombo. Category: Nature',
          score: 0.57,
        },
        {
          id: '3',
          title: 'Poor Activity',
          content: 'Low quality. Near: Colombo. Category: Beach',
          score: 0.45, // Below MINIMUM
        },
        {
          id: '4',
          title: 'Terrible Activity',
          content: 'Very low. Near: Colombo. Category: Adventure',
          score: 0.3, // Well below MINIMUM
        },
      ];

      mockAIService.search.mockResolvedValue(mockResults);

      const request = {
        destination: 'Colombo',
        startDate: '2026-03-15',
        endDate: '2026-03-17',
        preferences: ['culture', 'nature', 'beach', 'adventure'],
      };

      const result = await controller.tripPlanEnhanced(
        { user: { id: 'test-user' }, headers: {} } as unknown as Request,
        request,
      );

      const allActivities = result.plan.dayByDayPlan.flatMap(
        (day) => day.activities,
      );

      // NO activity should have score < 0.55
      allActivities.forEach((activity) => {
        expect(
          activity.explanation!.rankingFactors.relevanceScore,
        ).toBeGreaterThanOrEqual(PLANNER_CONFIG.CONFIDENCE.MINIMUM);
      });

      // Should NOT include the poor activities
      const titles = allActivities.map((a) => a.placeName);
      expect(titles).not.toContain('Poor Activity');
      expect(titles).not.toContain('Terrible Activity');
    });
  });

  describe('No Irrelevant Promotion', () => {
    it('should not promote low-quality items just to fill category quotas', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Excellent Temple',
          content: 'Top quality. Near: Galle. Category: Culture',
          score: 0.92,
        },
        {
          id: '2',
          title: 'Great Museum',
          content: 'High quality. Near: Galle. Category: Culture',
          score: 0.87,
        },
        {
          id: '3',
          title: 'Nice Fort',
          content: 'Good quality. Near: Galle. Category: History',
          score: 0.83,
        },
        {
          id: '4',
          title: 'Weak Beach',
          content: 'Poor match. Near: Galle. Category: Beach',
          score: 0.52, // Just below MINIMUM, should be excluded
        },
      ];

      mockAIService.search.mockResolvedValue(mockResults);

      const request = {
        destination: 'Galle',
        startDate: '2026-03-20',
        endDate: '2026-03-21',
        preferences: ['culture', 'history', 'beach'],
      };

      const result = await controller.tripPlanEnhanced(
        { user: { id: 'test-user' }, headers: {} } as unknown as Request,
        request,
      );

      const allActivities = result.plan.dayByDayPlan.flatMap(
        (day) => day.activities,
      );

      // Weak Beach should NOT be included
      const titles = allActivities.map((a) => a.placeName);
      expect(titles).not.toContain('Weak Beach');

      // All included activities should be quality picks
      allActivities.forEach((activity) => {
        expect(
          activity.explanation!.rankingFactors.relevanceScore,
        ).toBeGreaterThanOrEqual(0.55);
      });
    });

    it('should maintain quality standards when diverse categories are requested', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Premium Activity A',
          content: 'Excellent. Near: Kandy. Category: Culture',
          score: 0.9,
        },
        {
          id: '2',
          title: 'Premium Activity B',
          content: 'Excellent. Near: Kandy. Category: Nature',
          score: 0.88,
        },
        {
          id: '3',
          title: 'Low Quality X',
          content: 'Poor. Near: Kandy. Category: Beach',
          score: 0.4, // Way below minimum
        },
        {
          id: '4',
          title: 'Low Quality Y',
          content: 'Poor. Near: Kandy. Category: Adventure',
          score: 0.35, // Way below minimum
        },
      ];

      mockAIService.search.mockResolvedValue(mockResults);

      const request = {
        destination: 'Kandy',
        startDate: '2026-03-25',
        endDate: '2026-03-26',
        preferences: ['culture', 'nature', 'beach', 'adventure'],
      };

      const result = await controller.tripPlanEnhanced(
        { user: { id: 'test-user' }, headers: {} } as unknown as Request,
        request,
      );

      const allActivities = result.plan.dayByDayPlan.flatMap(
        (day) => day.activities,
      );

      // Should only include premium activities
      const titles = allActivities.map((a) => a.placeName);
      expect(titles).toContain('Premium Activity A');
      expect(titles).toContain('Premium Activity B');
      expect(titles).not.toContain('Low Quality X');
      expect(titles).not.toContain('Low Quality Y');

      // Verify quality floor
      allActivities.forEach((activity) => {
        expect(
          activity.explanation!.rankingFactors.relevanceScore,
        ).toBeGreaterThanOrEqual(PLANNER_CONFIG.CONFIDENCE.MINIMUM);
      });
    });
  });

  describe('Diversity with Quality Balance', () => {
    it('should achieve diversity without compromising minimum quality standards', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Temple',
          content: 'Culture site. Near: Kandy. Category: Culture',
          score: 0.85,
        },
        {
          id: '2',
          title: 'Beach',
          content: 'Beach area. Near: Kandy. Category: Beach',
          score: 0.8,
        },
        {
          id: '3',
          title: 'Forest',
          content: 'Nature park. Near: Kandy. Category: Nature',
          score: 0.75,
        },
        {
          id: '4',
          title: 'Adventure Park',
          content: 'Adventure site. Near: Kandy. Category: Adventure',
          score: 0.7,
        },
      ];

      mockAIService.search.mockResolvedValue(mockResults);

      const request = {
        destination: 'Kandy',
        startDate: '2026-03-28',
        endDate: '2026-03-30',
        preferences: ['culture', 'beach', 'nature', 'adventure'],
      };

      const result = await controller.tripPlanEnhanced(
        { user: { id: 'test-user' }, headers: {} } as unknown as Request,
        request,
      );

      const allActivities = result.plan.dayByDayPlan.flatMap(
        (day) => day.activities,
      );

      // Should have diverse categories
      const uniqueCategories = new Set(
        allActivities.map((a) => a.explanation!.rankingFactors.categoryMatch),
      );

      // Should include multiple categories (diversity achieved)
      expect(uniqueCategories.size).toBeGreaterThanOrEqual(2);

      // But all should meet quality standards
      allActivities.forEach((activity) => {
        expect(
          activity.explanation!.rankingFactors.relevanceScore,
        ).toBeGreaterThanOrEqual(PLANNER_CONFIG.CONFIDENCE.MINIMUM);
      });
    });
  });
});
