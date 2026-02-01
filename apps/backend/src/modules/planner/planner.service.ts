/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TripData {
  name?: string;
  destination?: string;
  startDate: string | Date;
  endDate: string | Date;
  itinerary: any;
}

export interface SavedTrip {
  id: number;
  userId: string;
  name: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  itinerary: any;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PlannerService {
  constructor(private readonly prisma: PrismaService) {}

  async saveTrip(userId: string, tripData: TripData): Promise<SavedTrip> {
    if (new Date(tripData.startDate) > new Date(tripData.endDate)) {
      throw new Error('Start date cannot be after end date');
    }
    if (!tripData.itinerary) {
      throw new Error('Itinerary data is required');
    }

    const result = await (this.prisma as any).savedTrip.create({
      data: {
        userId,
        name: tripData.name || 'My Trip',
        destination: tripData.destination || 'Sri Lanka',
        startDate: new Date(tripData.startDate),
        endDate: new Date(tripData.endDate),
        itinerary: tripData.itinerary as object,
      },
    });

    return result as SavedTrip;
  }

  async getHistory(userId: string): Promise<SavedTrip[]> {
    return (this.prisma as any).savedTrip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<SavedTrip[]>;
  }

  async updateTrip(
    userId: string,
    tripId: number,
    data: TripData,
  ): Promise<SavedTrip> {
    if (
      data.startDate &&
      data.endDate &&
      new Date(data.startDate) > new Date(data.endDate)
    ) {
      throw new Error('Start date cannot be after end date');
    }

    const trip = (await (this.prisma as any).savedTrip.findUnique({
      where: { id: tripId },
    })) as SavedTrip | null;

    if (!trip || trip.userId !== userId) {
      throw new Error('Trip not found or access denied');
    }

    return (this.prisma as any).savedTrip.update({
      where: { id: tripId },
      data: {
        name: data.name,
        destination: data.destination,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        itinerary: data.itinerary as object,
      },
    }) as Promise<SavedTrip>;
  }

  async deleteTrip(userId: string, tripId: number): Promise<SavedTrip> {
    const trip = (await (this.prisma as any).savedTrip.findUnique({
      where: { id: tripId },
    })) as SavedTrip | null;

    if (!trip || trip.userId !== userId) {
      throw new Error('Trip not found or access denied');
    }

    return (this.prisma as any).savedTrip.delete({
      where: { id: tripId },
    }) as Promise<SavedTrip>;
  }
}
