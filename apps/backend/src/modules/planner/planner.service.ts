/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
    feedbackValue: any,
  ): Promise<any> {
    // Verify trip exists and belongs to user
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
        'Access denied. You can only provide feedback for your own trips.',
      );
    }

    // Use upsert to handle both new feedback and updates
    // If user has already submitted feedback for this trip, update it
    const feedback = await (this.prisma as any).tripFeedback.upsert({
      where: {
        unique_user_trip_feedback: {
          userId,
          tripId,
        },
      },
      update: {
        feedbackValue: feedbackValue as object,
      },
      create: {
        userId,
        tripId,
        feedbackValue: feedbackValue as object,
      },
    });

    return feedback;
  }
}
