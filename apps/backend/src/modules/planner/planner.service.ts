import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlannerService {
  constructor(private readonly prisma: PrismaService) { }

  async saveTrip(userId: string, tripData: any) {
    if (new Date(tripData.startDate) > new Date(tripData.endDate)) {
      throw new Error('Start date cannot be after end date');
    }
    if (!tripData.itinerary) {
      throw new Error('Itinerary data is required');
    }

    return (this.prisma as any).savedTrip.create({
      data: {
        userId,
        name: tripData.name || 'My Trip',
        destination: tripData.destination || 'Sri Lanka',
        startDate: new Date(tripData.startDate),
        endDate: new Date(tripData.endDate),
        itinerary: tripData.itinerary,
      },
    });
  }

  async getHistory(userId: string) {
    return (this.prisma as any).savedTrip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTrip(userId: string, tripId: number, data: any) {
    if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
      throw new Error('Start date cannot be after end date');
    }

    const trip = await (this.prisma as any).savedTrip.findUnique({ where: { id: tripId } });
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
        itinerary: data.itinerary,
      },
    });
  }

  async deleteTrip(userId: string, tripId: number) {
    const trip = await (this.prisma as any).savedTrip.findUnique({ where: { id: tripId } });
    if (!trip || trip.userId !== userId) {
      throw new Error('Trip not found or access denied');
    }
    return (this.prisma as any).savedTrip.delete({ where: { id: tripId } });
  }
}
