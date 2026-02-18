//apps\backend\src\modules\planner\planner.service.ts
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import {
  PlannerAggregationService,
  FeedbackAggregation,
  DestinationFeedback,
} from './planner-aggregation.service';
import { FeedbackMappingService } from '../feedback/feedback-mapping.service';

export interface SavedTrip {
  id: string;
  userId: string;
  name: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  itinerary: any;
  preferences?: any;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PlannerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedbackMappingService: FeedbackMappingService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly aggregationService: PlannerAggregationService,
  ) {}

  private normalizePreferences(
    prefs?: Record<string, any>,
  ): Record<string, any> {
    if (!prefs) {
      return {
        budget: 'medium',
        interests: [],
        travelStyle: 'relaxed',
        accessibility: false,
      };
    }

    // Validate and normalize preferences
    const normalized = {
      budget: prefs.budget || 'medium',
      interests: Array.isArray(prefs.interests) ? prefs.interests : [],
      travelStyle: prefs.travelStyle || 'relaxed',
      accessibility: !!prefs.accessibility,
    };

    // Validate interests array length
    if (normalized.interests.length > 20) {
      throw new BadRequestException(
        'Too many interests specified. Maximum is 20.',
      );
    }

    return normalized;
  }

  async saveTrip(userId: string, tripData: CreateTripDto): Promise<SavedTrip> {
    // Validation is now handled by class-validator decorators
    // Additional business logic validation can be added here

    const normalizedPrefs = this.normalizePreferences(tripData.preferences);

    const result = await (this.prisma as any).savedTrip.create({
      data: {
        userId,
        name: tripData.name || 'My Trip',
        destination: tripData.destination || 'Sri Lanka',
        startDate: new Date(tripData.startDate),
        endDate: new Date(tripData.endDate),
        itinerary: tripData.itinerary as object,
        preferences: normalizedPrefs,
      },
    });

    // Validating & Storing User History (Day 40 Task)
    try {
      await (this.prisma as any).user.update({
        where: { id: userId },
        data: { preferences: normalizedPrefs },
      });
    } catch (e) {
      // Non-blocking error for user preference update
      console.warn('Failed to update user preferences history', e);
    }

    await this.cacheManager.del(`planner_history_${userId}`);

    return result as SavedTrip;
  }

  async getTrip(userId: string, tripId: string): Promise<SavedTrip | null> {
    const cacheKey = `trip_${tripId}`;
    const cachedTrip = await this.cacheManager.get<SavedTrip>(cacheKey);

    if (cachedTrip) {
      if (cachedTrip.userId !== userId) {
        throw new Error('Access denied');
      }
      return cachedTrip;
    }

    const trip = (await (this.prisma as any).savedTrip.findUnique({
      where: { id: tripId },
    })) as SavedTrip | null;

    if (!trip || trip.userId !== userId) {
      return null;
    }

    await this.cacheManager.set(cacheKey, trip, 300000); // 5 minutes TTL
    return trip;
  }

  async getHistory(userId: string): Promise<SavedTrip[]> {
    const cacheKey = `planner_history_${userId}`;
    const cachedData = await this.cacheManager.get<SavedTrip[]>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const history = (await (this.prisma as any).savedTrip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })) as SavedTrip[];

    await this.cacheManager.set(cacheKey, history, 300000); // 5 minutes TTL
    return history;
  }

  async updateTrip(
    userId: string,
    tripId: string,
    data: UpdateTripDto,
  ): Promise<SavedTrip> {
    // Validation is now handled by class-validator decorators

    const trip = (await (this.prisma as any).savedTrip.findUnique({
      where: { id: tripId },
    })) as SavedTrip | null;

    if (!trip) {
      throw new BadRequestException(
        `Trip with ID ${tripId} not found. Please check the trip ID and try again.`,
      );
    }

    if (trip.userId !== userId) {
      throw new BadRequestException(
        'Access denied. You can only update your own trips.',
      );
    }

    // Invalidate caches
    await this.cacheManager.del(`planner_history_${userId}`);
    await this.cacheManager.del(`trip_${tripId}`);

    const normalizedPrefs = this.normalizePreferences(data.preferences);

    const updatedTrip = (await (this.prisma as any).savedTrip.update({
      where: { id: tripId },
      data: {
        name: data.name,
        destination: data.destination,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        itinerary: data.itinerary as object,
        preferences: normalizedPrefs,
      },
    })) as SavedTrip;

    // Cache the updated trip immediately
    await this.cacheManager.set(`trip_${tripId}`, updatedTrip, 300000);

    return updatedTrip;
  }

  async deleteTrip(userId: string, tripId: string): Promise<SavedTrip> {
    const trip = (await (this.prisma as any).savedTrip.findUnique({
      where: { id: tripId },
    })) as SavedTrip | null;

    if (!trip) {
      throw new BadRequestException(
        `Trip with ID ${tripId} not found. Please check the trip ID and try again.`,
      );
    }

    if (trip.userId !== userId) {
      throw new BadRequestException(
        'Access denied. You can only delete your own trips.',
      );
    }

    // Invalidate caches
    await this.cacheManager.del(`planner_history_${userId}`);
    await this.cacheManager.del(`trip_${tripId}`);

    return (this.prisma as any).savedTrip.delete({
      where: { id: tripId },
    }) as Promise<SavedTrip>;
  }

  async submitFeedback(
    userId: string,
    tripId: string,
    feedbackValue: number,
  ): Promise<any> {
    // Validate numeric range (extra safety layer)
    if (feedbackValue < 1 || feedbackValue > 5) {
      throw new BadRequestException('Feedback value must be between 1 and 5.');
    }

    // Verify trip exists and belongs to user
    const trip = await this.getTrip(userId, tripId);
    if (!trip) {
      throw new BadRequestException(`Trip with ID ${tripId} not found.`);
    }

    // Save numeric feedback
    const feedback = await this.prisma.plannerFeedback.upsert({
      where: {
        unique_user_trip_feedback: {
          userId,
          tripId,
        },
      },
      update: { feedbackValue },
      create: { userId, tripId, feedbackValue },
    });

    // Pass tripId to match processFeedback signature
    await this.feedbackMappingService.processFeedback(userId, tripId, {
      rating: feedbackValue,
    });

    return feedback;
  }

  /**
   * Get aggregated feedback for a specific trip
   * Day 46 Task 1: Feedback Aggregation Logic
   */
  async getFeedbackAggregation(tripId: string): Promise<FeedbackAggregation> {
    return this.aggregationService.aggregateTripFeedback(tripId);
  }

  /**
   * Get aggregated feedback by destination
   */
  async getDestinationFeedback(
    destination: string,
  ): Promise<DestinationFeedback> {
    return this.aggregationService.aggregateByDestination(destination);
  }

  /**
   * Get aggregated feedback by category
   */
  async getCategoryFeedback(category: string): Promise<FeedbackAggregation> {
    return this.aggregationService.aggregateByCategory(category);
  }

  /**
   * Invalidate feedback cache when new feedback is submitted
   */
  async invalidateFeedbackCache(
    tripId: string,
    destination?: string,
  ): Promise<void> {
    await this.aggregationService.invalidateCache(tripId, destination);
  }

  async getFeedback(userId: string, tripId: string): Promise<any[]> {
    const trip = (await (this.prisma as any).savedTrip.findUnique({
      where: { id: tripId },
    })) as SavedTrip | null;

    if (!trip || trip.userId !== userId) {
      throw new BadRequestException('Access denied.');
    }

    const feedbackEntries = await (this.prisma as any).plannerFeedback.findMany(
      {
        where: { userId, tripId },
        orderBy: { createdAt: 'desc' },
      },
    );

    const latestVersion = await (this.prisma as any).tripVersion.findFirst({
      where: { tripId },
      orderBy: { versionNo: 'desc' },
    });

    return feedbackEntries.map((entry: any) => ({
      ...entry,
      plannerMeta: latestVersion?.aiMeta ?? null,
      versionNo: latestVersion?.versionNo ?? null,
    }));
  }
}
