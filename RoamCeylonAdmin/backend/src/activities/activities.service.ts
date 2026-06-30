import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ══════════════════════════════════════════════════════════════════════════
  //  DASHBOARD STATS
  // ══════════════════════════════════════════════════════════════════════════

  async getDashboardStats(providerId: string) {
    const [
      totalActivities,
      activeActivities,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      recentActivities,
    ] = await Promise.all([
      this.prisma.activity.count({ where: { providerId } }),
      this.prisma.activity.count({ where: { providerId, status: 'active' } }),
      this.prisma.activityBooking.count({ where: { providerId } }),
      this.prisma.activityBooking.count({
        where: { providerId, status: 'confirmed' },
      }),
      this.prisma.activityBooking.count({
        where: { providerId, status: 'pending' },
      }),
      this.prisma.activity.findMany({
        where: { providerId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { _count: { select: { bookings: true } } },
      }),
    ]);

    return {
      totalActivities,
      activeActivities,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      rating: '4.9', // Placeholder until review system is built
      recentActivities,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ACTIVITIES CRUD
  // ══════════════════════════════════════════════════════════════════════════

  async findAllActivities(providerId: string) {
    return this.prisma.activity.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { bookings: true } } },
    });
  }

  async findOneActivity(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    });
    if (!activity) throw new NotFoundException(`Activity "${id}" not found`);
    return activity;
  }

  async createActivity(providerId: string, dto: CreateActivityDto) {
    const status =
      dto.publishImmediately !== false ? 'active' : 'draft';

    const activity = await this.prisma.activity.create({
      data: {
        providerId,
        name: dto.name,
        category: dto.category,
        description: dto.description ?? '',
        coverImageUrl: dto.coverImageUrl ?? '',
        difficulty: dto.difficulty ?? 'easy',
        startTime: dto.startTime ?? '',
        endTime: dto.endTime ?? '',
        location: dto.location ?? '',
        price: dto.price ?? 0,
        maxParticipants: dto.maxParticipants ?? 20,
        status,
      },
    });

    this.logger.log(
      `Created activity "${activity.name}" (${activity.id}) for provider ${providerId}`,
    );
    return activity;
  }

  async updateActivity(
    id: string,
    dto: UpdateActivityDto,
    requesterId: string,
  ) {
    const existing = await this.prisma.activity.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Activity "${id}" not found`);
    if (existing.providerId !== requesterId) {
      throw new ForbiddenException('You do not own this activity');
    }

    const activity = await this.prisma.activity.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        category: dto.category ?? existing.category,
        description: dto.description ?? existing.description,
        coverImageUrl: dto.coverImageUrl ?? existing.coverImageUrl,
        difficulty: dto.difficulty ?? existing.difficulty,
        startTime: dto.startTime ?? existing.startTime,
        endTime: dto.endTime ?? existing.endTime,
        location: dto.location ?? existing.location,
        price: dto.price ?? existing.price,
        maxParticipants: dto.maxParticipants ?? existing.maxParticipants,
        status: dto.status ?? existing.status,
      },
    });

    this.logger.log(`Updated activity "${activity.name}" (${id})`);
    return activity;
  }

  async deleteActivity(id: string, requesterId: string) {
    const existing = await this.prisma.activity.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Activity "${id}" not found`);
    if (existing.providerId !== requesterId) {
      throw new ForbiddenException('You do not own this activity');
    }

    await this.prisma.activity.delete({ where: { id } });
    this.logger.log(`Deleted activity "${existing.name}" (${id})`);
    return { message: `Activity "${existing.name}" deleted successfully` };
  }

  async updateActivityStatus(id: string, status: string) {
    const existing = await this.prisma.activity.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Activity "${id}" not found`);

    const activity = await this.prisma.activity.update({
      where: { id },
      data: { status },
    });

    this.logger.log(`Activity ${id} status → "${status}"`);
    return activity;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  UPCOMING SCHEDULE
  // ══════════════════════════════════════════════════════════════════════════

  async findUpcomingSchedule(providerId: string) {
    return this.prisma.activityBooking.findMany({
      where: {
        providerId,
        status: { in: ['pending', 'confirmed'] },
        scheduledDate: { gte: new Date() },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 10,
      include: {
        activity: {
          select: {
            name: true,
            category: true,
            location: true,
            startTime: true,
            maxParticipants: true,
          },
        },
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  IMAGE UPLOAD (reuses Nhost Storage pattern from tour-guide)
  // ══════════════════════════════════════════════════════════════════════════

  async uploadImage(
    base64: string,
    mimeType: string = 'image/jpeg',
    authHeader?: string,
  ): Promise<{ url: string; fileId?: string }> {
    const subdomain = process.env.NHOST_SUBDOMAIN || 'qfgzcxodwisrwyduyocq';
    const region = process.env.NHOST_REGION || 'ap-southeast-1';
    const adminSecret = process.env.NHOST_ADMIN_SECRET;
    this.logger.log(`NHOST_ADMIN_SECRET is: ${adminSecret ? 'SET' : 'NOT SET'}`);
    const storageUrl = `https://${subdomain}.storage.${region}.nhost.run/v1/files`;

    const buffer = Buffer.from(base64, 'base64');
    const blob = new Blob([buffer], { type: mimeType });

    const formData = new FormData();
    formData.append('bucket-id', 'Activities');
    formData.append('file[]', blob, `activity_${Date.now()}.jpg`);

    const headers: Record<string, string> = {};
    if (adminSecret) {
      headers['x-hasura-admin-secret'] = adminSecret;
    } else if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(storageUrl, {
      method: 'POST',
      headers,
      body: formData as unknown as BodyInit,
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Nhost Storage upload failed: ${errorText}`);
      throw new Error(`Storage upload failed: ${errorText}`);
    }

    type NhostUploadResponse = {
      id?: string;
      processedFiles?: Array<{ id: string }>;
    };
    const data = (await response.json()) as
      | NhostUploadResponse
      | Array<{ id: string }>;

    let fileId: string | undefined;
    if (Array.isArray(data)) {
      fileId = data[0]?.id;
    } else {
      fileId = data.processedFiles?.[0]?.id ?? data.id;
    }

    if (!fileId) throw new Error('Upload succeeded but no file ID returned');

    this.logger.log(`Image uploaded to Nhost Storage: ${fileId}`);
    return { url: `${storageUrl}/${fileId}`, fileId };
  }
}
