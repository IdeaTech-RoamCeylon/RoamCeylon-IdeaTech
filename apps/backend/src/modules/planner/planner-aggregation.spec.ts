import { Test, TestingModule } from '@nestjs/testing';
import { PlannerAggregationService } from './planner-aggregation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('PlannerAggregationService', () => {
  let service: PlannerAggregationService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockPrismaService = {
    plannerFeedback: {
      findMany: jest.fn(),
    },
    savedTrip: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlannerAggregationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<PlannerAggregationService>(PlannerAggregationService);

    jest.clearAllMocks();
  });

  describe('aggregateTripFeedback', () => {
    const tripId = 'test-trip-123';

    it('should aggregate feedback with positive and negative counts', async () => {
      const mockFeedback = [
        {
          id: 1,
          userId: 'user1',
          tripId,
          feedbackValue: { rating: 5, comment: 'Excellent!' },
          createdAt: new Date(),
        },
        {
          id: 2,
          userId: 'user2',
          tripId,
          feedbackValue: { rating: 4, comment: 'Good' },
          createdAt: new Date(),
        },
        {
          id: 3,
          userId: 'user3',
          tripId,
          feedbackValue: { rating: 2, comment: 'Poor' },
          createdAt: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.plannerFeedback.findMany.mockResolvedValue(
        mockFeedback,
      );

      const result = await service.aggregateTripFeedback(tripId);

      expect(result.totalFeedback).toBe(3);
      expect(result.positiveCount).toBe(2); // ratings >= 4
      expect(result.negativeCount).toBe(1); // rating < 4
      expect(result.averageRating).toBeCloseTo(3.67, 1);
      expect(result.hasMinimumThreshold).toBe(true); // >= 3 ratings
    });

    it('should handle no feedback gracefully', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.plannerFeedback.findMany.mockResolvedValue([]);

      const result = await service.aggregateTripFeedback(tripId);

      expect(result.totalFeedback).toBe(0);
      expect(result.positiveCount).toBe(0);
      expect(result.negativeCount).toBe(0);
      expect(result.averageRating).toBe(0);
      expect(result.hasMinimumThreshold).toBe(false);
    });

    it('should not meet threshold with less than 3 feedback', async () => {
      const mockFeedback = [
        {
          id: 1,
          userId: 'user1',
          tripId,
          feedbackValue: { rating: 5 },
          createdAt: new Date(),
        },
        {
          id: 2,
          userId: 'user2',
          tripId,
          feedbackValue: { rating: 4 },
          createdAt: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.plannerFeedback.findMany.mockResolvedValue(
        mockFeedback,
      );

      const result = await service.aggregateTripFeedback(tripId);

      expect(result.totalFeedback).toBe(2);
      expect(result.hasMinimumThreshold).toBe(false); // < 3 ratings
    });

    it('should aggregate category-based feedback correctly', async () => {
      const mockFeedback = [
        {
          id: 1,
          userId: 'user1',
          tripId,
          feedbackValue: {
            rating: 5,
            categories: { accuracy: 5, relevance: 4 },
          },
          createdAt: new Date(),
        },
        {
          id: 2,
          userId: 'user2',
          tripId,
          feedbackValue: {
            rating: 4,
            categories: { accuracy: 4, relevance: 5 },
          },
          createdAt: new Date(),
        },
        {
          id: 3,
          userId: 'user3',
          tripId,
          feedbackValue: {
            rating: 3,
            categories: { accuracy: 3, relevance: 3 },
          },
          createdAt: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.plannerFeedback.findMany.mockResolvedValue(
        mockFeedback,
      );

      const result = await service.aggregateTripFeedback(tripId);

      expect(result.categoryBreakdown).toBeDefined();
      expect(result.categoryBreakdown!.accuracy).toBeDefined();
      expect(result.categoryBreakdown!.accuracy.positive).toBe(2); // accuracy >= 4
      expect(result.categoryBreakdown!.accuracy.negative).toBe(1); // accuracy < 4
      expect(result.categoryBreakdown!.accuracy.average).toBe(4);
    });

    it('should use cached data when available', async () => {
      const cachedResult = {
        totalFeedback: 5,
        positiveCount: 4,
        negativeCount: 1,
        averageRating: 4.2,
        hasMinimumThreshold: true,
      };

      mockCacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.aggregateTripFeedback(tripId);

      expect(result).toEqual(cachedResult);
      expect(mockPrismaService.plannerFeedback.findMany).not.toHaveBeenCalled();
    });
  });

  describe('aggregateByDestination', () => {
    const destination = 'Colombo';

    it('should aggregate feedback across multiple trips', async () => {
      const mockTrips = [{ id: 'trip1' }, { id: 'trip2' }];

      const mockFeedback = [
        {
          id: 1,
          userId: 'user1',
          tripId: 'trip1',
          feedbackValue: { rating: 5 },
          createdAt: new Date(),
        },
        {
          id: 2,
          userId: 'user2',
          tripId: 'trip1',
          feedbackValue: { rating: 4 },
          createdAt: new Date(),
        },
        {
          id: 3,
          userId: 'user3',
          tripId: 'trip2',
          feedbackValue: { rating: 3 },
          createdAt: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.savedTrip.findMany.mockResolvedValue(mockTrips);
      mockPrismaService.plannerFeedback.findMany.mockResolvedValue(
        mockFeedback,
      );

      const result = await service.aggregateByDestination(destination);

      expect(result.destination).toBe(destination);
      expect(result.totalFeedback).toBe(3);
      expect(result.positiveCount).toBe(2);
      expect(result.negativeCount).toBe(1);
      expect(result.hasMinimumThreshold).toBe(true);
    });
  });

  describe('aggregateByCategory', () => {
    it('should filter feedback by specific category', async () => {
      const category = 'accuracy';
      const mockFeedback = [
        {
          id: 1,
          userId: 'user1',
          tripId: 'trip1',
          feedbackValue: {
            rating: 5,
            categories: { accuracy: 5, other: 3 },
          },
          createdAt: new Date(),
        },
        {
          id: 2,
          userId: 'user2',
          tripId: 'trip2',
          feedbackValue: {
            rating: 4,
            categories: { accuracy: 4 },
          },
          createdAt: new Date(),
        },
        {
          id: 3,
          userId: 'user3',
          tripId: 'trip3',
          feedbackValue: {
            rating: 3,
            categories: { different: 3 }, // No 'accuracy' category
          },
          createdAt: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.plannerFeedback.findMany.mockResolvedValue(
        mockFeedback,
      );

      const result = await service.aggregateByCategory(category);

      // Should only count feedback with 'accuracy' category
      expect(result.totalFeedback).toBe(2);
      expect(result.positiveCount).toBe(2);
    });
  });
});
