import { Test, TestingModule } from '@nestjs/testing';
import { PlannerService } from './planner.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedbackMappingService } from '../feedback/feedback-mapping.service';
import { PlannerAggregationService } from './planner-aggregation.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

describe('PlannerService - Validation Tests', () => {
  let service: PlannerService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    // Mock PrismaService
    const mockPrisma = {
      savedTrip: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
    };

    // Mock Cache Manager
    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    // Mock FeedbackMappingService
    const mockFeedbackMappingService = {
      processFeedback: jest.fn(),
    };

    // Mock PlannerAggregationService
    const mockAggregationService = {
      aggregateTripFeedback: jest.fn(),
      aggregateByDestination: jest.fn(),
      aggregateByCategory: jest.fn(),
      invalidateCache: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlannerService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCache,
        },
        {
          provide: FeedbackMappingService,
          useValue: mockFeedbackMappingService,
        },
        {
          provide: PlannerAggregationService,
          useValue: mockAggregationService,
        },
      ],
    }).compile();

    service = module.get<PlannerService>(PlannerService);
    prismaService = module.get(PrismaService);
  });

  describe('saveTrip - Preference Validation', () => {
    it('should apply safe defaults when preferences are missing', async () => {
      const tripData: CreateTripDto = {
        name: 'Test Trip',
        destination: 'Colombo',
        startDate: '2026-03-01',
        endDate: '2026-03-05',
        itinerary: { days: [] },
      };

      (prismaService as any).savedTrip.create.mockResolvedValue({
        id: 1,
        userId: 'user1',
        ...tripData,
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.saveTrip('user1', tripData);

      expect((prismaService as any).savedTrip.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          preferences: expect.objectContaining({
            budget: 'medium',
            interests: [],
            travelStyle: 'relaxed',
            accessibility: false,
          }),
        }),
      });
    });

    it('should reject too many interests (>20)', async () => {
      const tripData: CreateTripDto = {
        startDate: '2026-03-01',
        endDate: '2026-03-05',
        itinerary: { days: [] },
        preferences: {
          budget: 'high',
          interests: new Array(25).fill('interest'), // 25 interests
          travelStyle: 'packed',
        },
      };

      await expect(service.saveTrip('user1', tripData)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.saveTrip('user1', tripData)).rejects.toThrow(
        'Too many interests specified. Maximum is 20.',
      );
    });

    it('should normalize preferences correctly', async () => {
      const tripData: CreateTripDto = {
        startDate: '2026-03-01',
        endDate: '2026-03-05',
        itinerary: { days: [] },
        preferences: {
          budget: 'low',
          interests: ['beach', 'temple'],
          travelStyle: 'moderate',
          accessibility: true,
        },
      };

      (prismaService as any).savedTrip.create.mockResolvedValue({
        id: 1,
        userId: 'user1',
        ...tripData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.saveTrip('user1', tripData);

      expect((prismaService as any).savedTrip.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          preferences: {
            budget: 'low',
            interests: ['beach', 'temple'],
            travelStyle: 'moderate',
            accessibility: true,
          },
        }),
      });
    });
  });

  describe('updateTrip - Access Control and Error Messages', () => {
    it('should provide actionable error when trip not found', async () => {
      const updateData: UpdateTripDto = {
        name: 'Updated Trip',
      };

      (prismaService as any).savedTrip.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTrip('user1', '999', updateData),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateTrip('user1', '999', updateData),
      ).rejects.toThrow('Trip with ID 999 not found');
    });

    it("should provide actionable error when accessing another user's trip", async () => {
      const updateData: UpdateTripDto = {
        name: 'Updated Trip',
      };

      (prismaService as any).savedTrip.findUnique.mockResolvedValue({
        id: 1,
        userId: 'user2', // Different user
        name: 'Original Trip',
        destination: 'Kandy',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-05'),
        itinerary: {},
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.updateTrip('user1', '1', updateData)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateTrip('user1', '1', updateData)).rejects.toThrow(
        'Access denied. You can only update your own trips.',
      );
    });
  });

  describe('deleteTrip - Access Control and Error Messages', () => {
    it('should provide actionable error when trip not found', async () => {
      (prismaService as any).savedTrip.findUnique.mockResolvedValue(null);

      await expect(service.deleteTrip('user1', '999')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteTrip('user1', '999')).rejects.toThrow(
        'Trip with ID 999 not found',
      );
    });

    it("should provide actionable error when deleting another user's trip", async () => {
      (prismaService as any).savedTrip.findUnique.mockResolvedValue({
        id: 1,
        userId: 'user2', // Different user
        name: 'Trip',
        destination: 'Galle',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-05'),
        itinerary: {},
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.deleteTrip('user1', '1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteTrip('user1', '1')).rejects.toThrow(
        'Access denied. You can only delete your own trips.',
      );
    });
  });
});
