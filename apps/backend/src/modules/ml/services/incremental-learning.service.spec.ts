import { Test, TestingModule } from '@nestjs/testing';
import { IncrementalLearningService, FeedbackSubmittedEvent } from './incremental-learning.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { MlPredictionService } from './mlPrediction.service';
import { BoundsEnforcerService } from '../../ai/bounds-enforcer.service';

describe('IncrementalLearningService', () => {
  let service: IncrementalLearningService;
  let prisma: PrismaService;
  let mlPredictionService: MlPredictionService;
  let boundsEnforcer: BoundsEnforcerService;
  let mockCache: Map<string, any>;

  beforeEach(async () => {
    mockCache = new Map();
    mockCache.set('user-123:trip_001,trip_002', {
      data: { recommendations: [] },
      timestamp: Date.now(),
    });
    mockCache.set('other-user:trip_001', {
      data: { recommendations: [] },
      timestamp: Date.now(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncrementalLearningService,
        {
          provide: PrismaService,
          useValue: {
            userInterestProfile: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
            },
            destinationCategoryScore: {
              upsert: jest.fn(),
            },
            plannerFeedback: {
              count: jest.fn(),
              findMany: jest.fn().mockResolvedValue([]),
            },
            savedTrip: {
              findMany: jest.fn().mockResolvedValue([]),
            },
          },
        },
        {
          provide: MlPredictionService,
          useValue: {
            getCache: jest.fn().mockReturnValue(mockCache),
          },
        },
        {
          provide: BoundsEnforcerService,
          useValue: {
            enforceSessionDelta: jest.fn().mockImplementation((userId, dim, delta) => delta),
            clearSessionDeltas: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IncrementalLearningService>(IncrementalLearningService);
    prisma = module.get<PrismaService>(PrismaService);
    mlPredictionService = module.get<MlPredictionService>(MlPredictionService);
    boundsEnforcer = module.get<BoundsEnforcerService>(BoundsEnforcerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onFeedbackSubmitted', () => {
    it('should invalidate the prediction cache for the user', async () => {
      const event: FeedbackSubmittedEvent = {
        userId: 'user-123',
        feedbackValue: 5,
        category: 'Beach',
        destinationId: 'trip_001',
      };

      await service.onFeedbackSubmitted(event);

      // Verify user-123's cache entries are deleted but other-user's are preserved
      expect(mockCache.has('user-123:trip_001,trip_002')).toBe(false);
      expect(mockCache.has('other-user:trip_001')).toBe(true);
    });

    it('should update the user interest profile with small positive delta for rating >= 4', async () => {
      const event: FeedbackSubmittedEvent = {
        userId: 'user-123',
        feedbackValue: 5,
        category: 'Beach',
        destinationId: 'trip_001',
      };

      jest.spyOn(prisma.userInterestProfile, 'findUnique').mockResolvedValue({
        userId: 'user-123',
        culturalScore: 1.0,
        adventureScore: 1.0,
        relaxationScore: 1.0,
      } as any);

      const upsertSpy = jest.spyOn(prisma.userInterestProfile, 'upsert');

      await service.onFeedbackSubmitted(event);

      expect(upsertSpy).toHaveBeenCalled();
      const upsertArgs = upsertSpy.mock.calls[0][0] as any;
      
      // Beach maps to { cultural: 0.0, adventure: 0.1, relaxation: 0.9 }
      // Rating 5 is positive -> delta = 0.05
      // Expected new relaxationScore = 1.0 + 0.9 * 0.05 = 1.045
      // Expected new adventureScore = 1.0 + 0.1 * 0.05 = 1.005
      // Expected new culturalScore = 1.0 + 0.0 * 0.05 = 1.0
      expect(upsertArgs.update.relaxationScore).toBeCloseTo(1.045, 3);
      expect(upsertArgs.update.adventureScore).toBeCloseTo(1.005, 3);
      expect(upsertArgs.update.culturalScore).toBeCloseTo(1.0, 3);
    });

    it('should update user interest profile with negative delta for rating <= 2', async () => {
      const event: FeedbackSubmittedEvent = {
        userId: 'user-123',
        feedbackValue: 2,
        category: 'Adventure',
        destinationId: 'trip_002',
      };

      jest.spyOn(prisma.userInterestProfile, 'findUnique').mockResolvedValue({
        userId: 'user-123',
        culturalScore: 1.0,
        adventureScore: 1.0,
        relaxationScore: 1.0,
      } as any);

      const upsertSpy = jest.spyOn(prisma.userInterestProfile, 'upsert');

      await service.onFeedbackSubmitted(event);

      expect(upsertSpy).toHaveBeenCalled();
      const upsertArgs = upsertSpy.mock.calls[0][0] as any;

      // Adventure maps to { cultural: 0.0, adventure: 1.0, relaxation: 0.0 }
      // Rating 2 is negative -> delta = -0.03
      // Expected new adventureScore = 1.0 - 0.03 = 0.97
      expect(upsertArgs.update.adventureScore).toBeCloseTo(0.97, 3);
      expect(upsertArgs.update.relaxationScore).toBeCloseTo(1.0, 3);
    });

    it('should ignore neutral rating of 3', async () => {
      const event: FeedbackSubmittedEvent = {
        userId: 'user-123',
        feedbackValue: 3,
        category: 'Nature',
      };

      const upsertSpy = jest.spyOn(prisma.userInterestProfile, 'upsert');

      await service.onFeedbackSubmitted(event);

      expect(upsertSpy).not.toHaveBeenCalled();
    });

    it('should fallback to destination keywords when category is undefined', async () => {
      const event: FeedbackSubmittedEvent = {
        userId: 'user-123',
        feedbackValue: 5,
        destination: 'Ella Scenic Tour',
      };

      jest.spyOn(prisma.userInterestProfile, 'findUnique').mockResolvedValue({
        userId: 'user-123',
        culturalScore: 1.0,
        adventureScore: 1.0,
        relaxationScore: 1.0,
      } as any);

      const upsertSpy = jest.spyOn(prisma.userInterestProfile, 'upsert');

      await service.onFeedbackSubmitted(event);

      expect(upsertSpy).toHaveBeenCalled();
      const upsertArgs = upsertSpy.mock.calls[0][0] as any;

      // "ella" matches adventure (adventure: 1.0)
      // Expected new adventure = 1.0 + 1.0 * 0.05 = 1.05
      expect(upsertArgs.update.adventureScore).toBeCloseTo(1.05, 3);
      expect(upsertArgs.update.culturalScore).toBeCloseTo(1.0, 3);
      expect(upsertArgs.update.relaxationScore).toBeCloseTo(1.0, 3);
    });
  });

  describe('maybeRefreshAllFeatures & refreshAllUserFeatures', () => {
    it('should trigger full refresh if feedback count is a multiple of 5', async () => {
      jest.spyOn(prisma.plannerFeedback, 'count').mockResolvedValue(5);
      const refreshSpy = jest.spyOn(service, 'refreshAllUserFeatures').mockResolvedValue(undefined);

      const event: FeedbackSubmittedEvent = {
        userId: 'user-123',
        feedbackValue: 5,
        category: 'Beach',
      };

      await service.onFeedbackSubmitted(event);

      expect(refreshSpy).toHaveBeenCalledWith('user-123');
    });

    it('should not trigger full refresh if feedback count is not a multiple of 5', async () => {
      jest.spyOn(prisma.plannerFeedback, 'count').mockResolvedValue(6);
      const refreshSpy = jest.spyOn(service, 'refreshAllUserFeatures').mockResolvedValue(undefined);

      const event: FeedbackSubmittedEvent = {
        userId: 'user-123',
        feedbackValue: 5,
        category: 'Beach',
      };

      await service.onFeedbackSubmitted(event);

      expect(refreshSpy).not.toHaveBeenCalled();
    });

    it('should correctly rebuild the user interest profile from all historic feedbacks during full refresh', async () => {
      const historicFeedbacks = [
        { tripId: 'trip-1', feedbackValue: 5, createdAt: new Date() }, // positive
        { tripId: 'trip-2', feedbackValue: 1, createdAt: new Date() }, // negative
        { tripId: 'trip-3', feedbackValue: 3, createdAt: new Date() }, // neutral (ignored)
      ];

      const savedTrips = [
        { id: 'trip-1', destination: 'Ella' }, // Ella -> Adventure: 1.0
        { id: 'trip-2', destination: 'Galle' }, // Galle -> Relaxation: 1.0
      ];

      jest.spyOn(prisma.plannerFeedback, 'findMany').mockResolvedValue(historicFeedbacks as any);
      jest.spyOn(prisma.savedTrip, 'findMany').mockResolvedValue(savedTrips as any);

      const upsertSpy = jest.spyOn(prisma.userInterestProfile, 'upsert');

      await service.refreshAllUserFeatures('user-123');

      expect(upsertSpy).toHaveBeenCalled();
      const upsertArgs = upsertSpy.mock.calls[0][0] as any;

      // Ella Adventure positive: +0.05
      // Galle Relaxation negative: -0.03
      // Clamped from base 0:
      // cultural = 0
      // adventure = 0.05
      // relaxation = 0 (clamped to min score 0 since -0.03 < 0)
      expect(upsertArgs.update.adventureScore).toBeCloseTo(0.05, 3);
      expect(upsertArgs.update.relaxationScore).toBeCloseTo(0.0, 3);
      expect(upsertArgs.update.culturalScore).toBeCloseTo(0.0, 3);
    });
  });
});
