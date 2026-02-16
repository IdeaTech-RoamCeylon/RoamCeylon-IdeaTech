/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { PlannerService } from './planner.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';

describe('PlannerService - Feedback', () => {
  let service: PlannerService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockPrismaService = {
    savedTrip: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    plannerFeedback: {
      create: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlannerService,
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

    service = module.get<PlannerService>(PlannerService);

    jest.clearAllMocks();
  });

  describe('submitFeedback', () => {
    const userId = 'test-user-123';
    const tripId = 'test-trip-uuid';
    const feedbackValue = {
      rating: 5,
      comment: 'Great trip planning!',
      categories: { accuracy: 5, relevance: 5 },
    };

    const mockTrip = {
      id: tripId,
      userId,
      name: 'My Trip',
      destination: 'Colombo',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-05'),
      itinerary: {},
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockFeedback = {
      id: 1,
      userId,
      tripId,
      feedbackValue,
      createdAt: new Date(),
    };

    it('should successfully submit feedback for own trip', async () => {
      mockPrismaService.savedTrip.findUnique.mockResolvedValue(mockTrip);
      mockPrismaService.plannerFeedback.upsert.mockResolvedValue(mockFeedback);

      const result = await service.submitFeedback(
        userId,
        tripId,
        feedbackValue,
      );

      expect(result).toEqual(mockFeedback);
      expect(mockPrismaService.savedTrip.findUnique).toHaveBeenCalledWith({
        where: { id: tripId },
      });
      expect(mockPrismaService.plannerFeedback.upsert).toHaveBeenCalledWith({
        where: {
          unique_user_trip_feedback: { userId, tripId },
        },
        update: { feedbackValue },
        create: { userId, tripId, feedbackValue },
      });
    });

    it('should throw BadRequestException if trip not found', async () => {
      mockPrismaService.savedTrip.findUnique.mockResolvedValue(null);

      await expect(
        service.submitFeedback(userId, tripId, feedbackValue),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.submitFeedback(userId, tripId, feedbackValue),
      ).rejects.toThrow(
        `Trip with ID ${tripId} not found. Please check the trip ID and try again.`,
      );
      expect(mockPrismaService.plannerFeedback.upsert).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user does not own the trip', async () => {
      const differentUserId = 'different-user-456';
      const mockTripOwnedByOther = { ...mockTrip, userId: differentUserId };
      mockPrismaService.savedTrip.findUnique.mockResolvedValue(
        mockTripOwnedByOther,
      );

      await expect(
        service.submitFeedback(userId, tripId, feedbackValue),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.submitFeedback(userId, tripId, feedbackValue),
      ).rejects.toThrow(
        'Access denied. You can only provide feedback for your own trips.',
      );
      expect(mockPrismaService.plannerFeedback.upsert).not.toHaveBeenCalled();
    });

    it('should accept feedback with only rating', async () => {
      const simpleFeedback = { rating: 4 };
      mockPrismaService.savedTrip.findUnique.mockResolvedValue(mockTrip);
      mockPrismaService.plannerFeedback.upsert.mockResolvedValue({
        ...mockFeedback,
        feedbackValue: simpleFeedback,
      });

      const result = await service.submitFeedback(
        userId,
        tripId,
        simpleFeedback,
      );

      expect(result.feedbackValue).toEqual(simpleFeedback);
      expect(mockPrismaService.plannerFeedback.upsert).toHaveBeenCalledWith({
        where: {
          unique_user_trip_feedback: { userId, tripId },
        },
        update: { feedbackValue: simpleFeedback },
        create: { userId, tripId, feedbackValue: simpleFeedback },
      });
    });

    it('should accept feedback with only comment', async () => {
      const commentOnlyFeedback = { comment: 'Needs improvement' };
      mockPrismaService.savedTrip.findUnique.mockResolvedValue(mockTrip);
      mockPrismaService.plannerFeedback.upsert.mockResolvedValue({
        ...mockFeedback,
        feedbackValue: commentOnlyFeedback,
      });

      const result = await service.submitFeedback(
        userId,
        tripId,
        commentOnlyFeedback,
      );

      expect(result.feedbackValue).toEqual(commentOnlyFeedback);
    });

    it('should update existing feedback instead of creating duplicate', async () => {
      const firstFeedback = { rating: 4, comment: 'Good' };
      const updatedFeedback = { rating: 5, comment: 'Excellent!' };

      mockPrismaService.savedTrip.findUnique.mockResolvedValue(mockTrip);

      // First submission
      mockPrismaService.plannerFeedback.upsert.mockResolvedValue({
        ...mockFeedback,
        feedbackValue: firstFeedback,
      });
      await service.submitFeedback(userId, tripId, firstFeedback);

      // Second submission (update)
      mockPrismaService.plannerFeedback.upsert.mockResolvedValue({
        ...mockFeedback,
        feedbackValue: updatedFeedback,
      });
      const result = await service.submitFeedback(
        userId,
        tripId,
        updatedFeedback,
      );

      // Verify upsert was called with update logic
      expect(result.feedbackValue).toEqual(updatedFeedback);
      expect(mockPrismaService.plannerFeedback.upsert).toHaveBeenCalledTimes(2);
    });
  });
});
