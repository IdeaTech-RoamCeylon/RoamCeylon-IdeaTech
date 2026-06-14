import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { CreatePublicInquiryDto } from './dto/create-public-inquiry.dto';
import { ConvertInquiryDto } from './dto/convert-inquiry.dto';
import type {
  PackageStatus,
  BookingStatus,
  InquiryStatus,
} from './entities/tour-guide.entity';

@Injectable()
export class TourGuideService {
  private readonly logger = new Logger(TourGuideService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ══════════════════════════════════════════════════════════════════════════
  //  PACKAGES
  // ══════════════════════════════════════════════════════════════════════════

  async findAllActivePublicPackages() {
    return this.prisma.tourPackage.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { bookings: true } } },
    });
  }

  async createPublicInquiry(dto: CreatePublicInquiryDto) {
    const pkg = await this.findOnePackage(dto.packageId);
    
    // Parse the requested date from the Tourist app
    const startDate = new Date(dto.date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (pkg.duration || 1));
    
    // Create the booking request directly as pending
    const booking = await this.prisma.tourBooking.create({
      data: {
        packageId: pkg.id,
        guideId: pkg.guideId,
        customerName: dto.guestName,
        customerEmail: dto.guestEmail,
        customerAvatar: dto.guestAvatar || '',
        tourName: pkg.name,
        startDate: startDate,
        endDate: endDate,
        guests: dto.numberOfPeople,
        amount: Number(pkg.price) * dto.numberOfPeople,
        status: 'pending',
      },
    });

    // Generate a notification for the guide
    await this.prisma.tourNotification.create({
      data: {
        guideId: pkg.guideId,
        type: 'booking',
        title: 'New Booking Request',
        message: `${dto.guestName} has requested a booking for "${pkg.name}".`,
        relatedEntityId: booking.id,
      },
    });

    return booking;
  }

  async findAllPackages(guideId: string) {
    return this.prisma.tourPackage.findMany({
      where: { guideId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { bookings: true } } },
    });
  }

  async findOnePackage(id: string) {
    const pkg = await this.prisma.tourPackage.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    });
    if (!pkg) throw new NotFoundException(`Package "${id}" not found`);
    return pkg;
  }

  async createPackage(guideId: string, dto: CreatePackageDto) {
    const status = dto.publishImmediately !== false ? 'active' : 'draft';

    const pkg = await this.prisma.tourPackage.create({
      data: {
        guideId,
        name: dto.name,
        category: dto.category,
        description: dto.description ?? '',
        coverImageUrl: dto.coverImageUrl ?? '',
        galleryUrls: dto.galleryUrls ?? [],
        duration: dto.duration ?? 1,
        price: dto.price ?? 0,
        highlights: dto.highlights ?? [],
        location: dto.location ?? '',
        status,
        publishImmediately: dto.publishImmediately ?? true,
      },
    });

    this.logger.log(
      `Created package "${pkg.name}" (${pkg.id}) for guide ${guideId}`,
    );
    return pkg;
  }

  async updatePackage(id: string, dto: UpdatePackageDto, requesterId: string) {
    const existing = await this.prisma.tourPackage.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Package "${id}" not found`);
    if (existing.guideId !== requesterId) {
      throw new ForbiddenException('You do not own this package');
    }

    const pkg = await this.prisma.tourPackage.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        category: dto.category ?? existing.category,
        description: dto.description ?? existing.description,
        coverImageUrl: dto.coverImageUrl ?? existing.coverImageUrl,
        galleryUrls: dto.galleryUrls ?? (existing.galleryUrls as unknown as string[]),
        duration: dto.duration ?? existing.duration,
        price: dto.price ?? existing.price,
        highlights:
          dto.highlights ?? (existing.highlights as unknown as string[]),
        location: dto.location ?? existing.location,
        publishImmediately:
          dto.publishImmediately ?? existing.publishImmediately,
        status: (dto.publishImmediately ?? existing.publishImmediately) ? 'active' : 'draft',
      },
    });

    this.logger.log(`Updated package "${pkg.name}" (${id})`);
    return pkg;
  }

  async deletePackage(id: string, requesterId: string) {
    const existing = await this.prisma.tourPackage.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Package "${id}" not found`);
    if (existing.guideId !== requesterId) {
      throw new ForbiddenException('You do not own this package');
    }

    await this.prisma.tourPackage.delete({ where: { id } });
    this.logger.log(`Deleted package "${existing.name}" (${id})`);
    return { message: `Package "${existing.name}" deleted successfully` };
  }

  async updatePackageStatus(id: string, status: PackageStatus) {
    const existing = await this.prisma.tourPackage.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Package "${id}" not found`);

    const pkg = await this.prisma.tourPackage.update({
      where: { id },
      data: { status },
    });

    this.logger.log(`Package ${id} status → "${status}"`);
    return pkg;
  }

  // ── Upload image to Nhost Storage ─────────────────────────────────────────

  async uploadImage(
    base64: string,
    mimeType: string = 'image/jpeg',
    authHeader?: string
  ): Promise<{ url: string; fileId?: string }> {
    const subdomain = process.env.NHOST_SUBDOMAIN || 'qfgzcxodwisrwyduyocq';
    const region = process.env.NHOST_REGION || 'ap-southeast-1';
    const adminSecret = process.env.NHOST_ADMIN_SECRET;
    const storageUrl = `https://${subdomain}.storage.${region}.nhost.run/v1/files`;

    const buffer = Buffer.from(base64, 'base64');
    const blob = new Blob([buffer], { type: mimeType });

    const formData = new FormData();
    formData.append('bucket-id', 'Tours');
    formData.append('file[]', blob, `tour_${Date.now()}.jpg`);

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

  // ══════════════════════════════════════════════════════════════════════════
  //  BOOKINGS
  // ══════════════════════════════════════════════════════════════════════════

  async findAllBookings(guideId: string, status?: BookingStatus) {
    return this.prisma.tourBooking.findMany({
      where: {
        guideId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { package: { select: { name: true, category: true } } },
    });
  }

  async findOneBooking(id: string) {
    const booking = await this.prisma.tourBooking.findUnique({
      where: { id },
      include: { package: true },
    });
    if (!booking) throw new NotFoundException(`Booking "${id}" not found`);
    return booking;
  }

  async createBooking(guideId: string, dto: CreateBookingDto) {
    // Verify package exists
    const pkg = await this.prisma.tourPackage.findUnique({
      where: { id: dto.packageId },
    });
    if (!pkg)
      throw new NotFoundException(`Package "${dto.packageId}" not found`);

    const booking = await this.prisma.tourBooking.create({
      data: {
        packageId: dto.packageId,
        guideId,
        customerId: dto.customerId ?? null,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail ?? '',
        customerAvatar: dto.customerAvatar ?? '',
        tourName: dto.tourName,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        guests: dto.guests ?? 1,
        amount: dto.amount ?? 0,
        status: 'pending',
      },
    });

    this.logger.log(`Created booking ${booking.id} for guide ${guideId}`);
    return booking;
  }

  async updateBookingStatus(id: string, status: BookingStatus) {
    const existing = await this.prisma.tourBooking.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Booking "${id}" not found`);

    const booking = await this.prisma.tourBooking.update({
      where: { id },
      data: { status },
    });

    this.logger.log(`Booking ${id} status → "${status}"`);
    return booking;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  INQUIRIES
  // ══════════════════════════════════════════════════════════════════════════

  async findAllInquiries(guideId: string, status?: InquiryStatus) {
    return this.prisma.tourInquiry.findMany({
      where: {
        guideId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInquiry(id: string) {
    const inquiry = await this.prisma.tourInquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundException(`Inquiry "${id}" not found`);
    return inquiry;
  }

  async getInquiryStats(guideId: string) {
    const [total, active, pending, priority, responded, inquiries] = await Promise.all([
      this.prisma.tourInquiry.count({ where: { guideId } }),
      this.prisma.tourInquiry.count({ where: { guideId, status: { in: ['new', 'responded', 'priority'] } } }),
      this.prisma.tourInquiry.count({ where: { guideId, status: 'new' } }),
      this.prisma.tourInquiry.count({ where: { guideId, status: 'priority' } }),
      this.prisma.tourInquiry.count({ where: { guideId, status: 'responded' } }),
      this.prisma.tourInquiry.findMany({
        where: { guideId },
        select: { pipelineValue: true, status: true },
      }),
    ]);

    const pipelineValue = inquiries.reduce(
      (sum, i) => sum + Number(i.pipelineValue),
      0,
    );

    return { total, active, pending, priority, responded, pipelineValue };
  }

  async createInquiry(guideId: string, dto: CreateInquiryDto) {
    const inquiry = await this.prisma.tourInquiry.create({
      data: {
        guideId,
        guestName: dto.guestName,
        guestEmail: dto.guestEmail ?? '',
        guestAvatar: dto.guestAvatar ?? '',
        subject: dto.subject ?? '',
        message: dto.message ?? '',
        status: 'new',
        tourInterest: dto.tourInterest ?? '',
        pipelineValue: dto.pipelineValue ?? 0,
      },
    });

    this.logger.log(
      `Created inquiry ${inquiry.id} from "${dto.guestName}" for guide ${guideId}`,
    );
    return inquiry;
  }

  async updateInquiryStatus(id: string, status: InquiryStatus) {
    const existing = await this.prisma.tourInquiry.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Inquiry "${id}" not found`);

    const inquiry = await this.prisma.tourInquiry.update({
      where: { id },
      data: { status },
    });

    this.logger.log(`Inquiry ${id} status → "${status}"`);
    return inquiry;
  }

  async convertInquiryToBooking(
    inquiryId: string,
    guideId: string,
    dto: ConvertInquiryDto,
  ) {
    const inquiry = await this.prisma.tourInquiry.findUnique({
      where: { id: inquiryId },
    });
    if (!inquiry || inquiry.guideId !== guideId) {
      throw new NotFoundException('Inquiry not found');
    }
    if (inquiry.status === 'converted') {
      throw new BadRequestException('Inquiry is already converted to a booking');
    }

    // Try to find the associated package
    // We match by tourInterest since public inquiry sets tourInterest = pkg.name
    const pkg = await this.prisma.tourPackage.findFirst({
      where: { guideId, name: inquiry.tourInterest },
    });

    if (!pkg) {
      throw new NotFoundException(`Tour package "${inquiry.tourInterest}" not found.`);
    }

    // Create the pending booking
    const booking = await this.prisma.tourBooking.create({
      data: {
        packageId: pkg.id,
        guideId: guideId,
        customerName: inquiry.guestName,
        customerEmail: inquiry.guestEmail,
        customerAvatar: inquiry.guestAvatar,
        tourName: inquiry.tourInterest,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        guests: dto.guests,
        amount: dto.amount,
        status: 'pending',
      },
    });

    // Update the inquiry status to converted
    await this.prisma.tourInquiry.update({
      where: { id: inquiryId },
      data: { status: 'converted' },
    });

    return booking;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════════════════

  async findAllNotifications(guideId: string) {
    return this.prisma.tourNotification.findMany({
      where: { guideId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string) {
    const existing = await this.prisma.tourNotification.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException(`Notification "${id}" not found`);

    return this.prisma.tourNotification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(guideId: string) {
    const result = await this.prisma.tourNotification.updateMany({
      where: { guideId, isRead: false },
      data: { isRead: true },
    });

    this.logger.log(
      `Marked ${result.count} notifications as read for guide ${guideId}`,
    );
    return { markedCount: result.count };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  DASHBOARD STATS
  // ══════════════════════════════════════════════════════════════════════════

  async getDashboardStats(guideId: string) {
    const [
      totalPackages,
      activePackages,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      completedBookings,
      totalInquiries,
      newInquiries,
      unreadNotifications,
      recentBookings,
      totalRevenueAgg,
    ] = await Promise.all([
      this.prisma.tourPackage.count({ where: { guideId } }),
      this.prisma.tourPackage.count({ where: { guideId, status: 'active' } }),
      this.prisma.tourBooking.count({ where: { guideId } }),
      this.prisma.tourBooking.count({ where: { guideId, status: 'confirmed' } }),
      this.prisma.tourBooking.count({ where: { guideId, status: 'pending' } }),
      this.prisma.tourBooking.count({ where: { guideId, status: 'completed' } }),
      this.prisma.tourInquiry.count({ where: { guideId } }),
      this.prisma.tourInquiry.count({ where: { guideId, status: 'new' } }),
      this.prisma.tourNotification.count({ where: { guideId, isRead: false } }),
      this.prisma.tourBooking.findMany({
        where: { guideId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { package: { select: { name: true, category: true } } },
      }),
      this.prisma.tourBooking.aggregate({
        where: { guideId, status: { in: ['confirmed', 'completed'] } },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = Number(totalRevenueAgg._sum.amount ?? 0);

    return {
      totalPackages,
      activePackages,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      completedBookings,
      totalInquiries,
      newInquiries,
      unreadNotifications,
      recentBookings,
      totalRevenue,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  REVENUE
  // ══════════════════════════════════════════════════════════════════════════

  async getRevenueStats(guideId: string) {
    // Fetch all confirmed/completed bookings
    const bookings = await this.prisma.tourBooking.findMany({
      where: {
        guideId,
        status: { in: ['confirmed', 'completed'] },
      },
      include: { package: { select: { name: true, category: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.amount), 0);

    // ── Monthly trend (last 6 months) ──────────────────────────────────────
    const now = new Date();
    const monthlyTrend: { label: string; total: number; month: number; year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const total = bookings
        .filter((b) => {
          const date = new Date(b.createdAt);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, b) => sum + Number(b.amount), 0);
      monthlyTrend.push({
        label: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        total,
      });
    }

    // ── Yearly trend (last 4 years) ────────────────────────────────────────
    const currentYear = now.getFullYear();
    const yearlyTrend: { label: string; year: number; total: number }[] = [];
    for (let y = currentYear - 3; y <= currentYear; y++) {
      const total = bookings
        .filter((b) => new Date(b.createdAt).getFullYear() === y)
        .reduce((sum, b) => sum + Number(b.amount), 0);
      yearlyTrend.push({ label: String(y), year: y, total });
    }

    // ── Breakdown by package category ─────────────────────────────────────
    const categoryMap: Record<string, number> = {};
    for (const b of bookings) {
      const cat = b.package?.category ?? 'Other';
      categoryMap[cat] = (categoryMap[cat] ?? 0) + Number(b.amount);
    }
    const breakdown = Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage:
          totalRevenue > 0 ? Math.round((amount / totalRevenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // ── High-value bookings (top 5 by amount) ─────────────────────────────
    const highValueBookings = [...bookings]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);

    return {
      totalRevenue,
      monthlyTrend,
      yearlyTrend,
      breakdown,
      highValueBookings,
    };
  }
}
