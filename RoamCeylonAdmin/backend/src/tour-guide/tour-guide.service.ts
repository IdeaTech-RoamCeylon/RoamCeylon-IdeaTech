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
        customerId: dto.customerId || null,
        customerName: dto.guestName,
        customerEmail: dto.guestEmail,
        customerAvatar: dto.guestAvatar || '',
        tourName: pkg.name,
        startDate: startDate,
        endDate: endDate,
        pickupLocation: dto.pickupLocation || '',
        customerPhone: dto.customerPhone || '',
        specialRequests: dto.specialRequests || '',
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

  async getUserBookings(userId: string) {
    return this.prisma.tourBooking.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        package: {
          select: { name: true, coverImageUrl: true, location: true },
        },
      },
    });
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
        galleryUrls:
          dto.galleryUrls ?? (existing.galleryUrls as unknown as string[]),
        duration: dto.duration ?? existing.duration,
        price: dto.price ?? existing.price,
        highlights:
          dto.highlights ?? (existing.highlights as unknown as string[]),
        location: dto.location ?? existing.location,
        publishImmediately:
          dto.publishImmediately ?? existing.publishImmediately,
        status:
          (dto.publishImmediately ?? existing.publishImmediately)
            ? 'active'
            : 'draft',
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
    authHeader?: string,
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
        pickupLocation: dto.pickupLocation || '',
        customerPhone: dto.customerPhone || '',
        specialRequests: dto.specialRequests || '',
        guests: dto.guests || 1,
        amount: dto.amount || 0,
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
    const [total, active, pending, priority, responded, inquiries] =
      await Promise.all([
        this.prisma.tourInquiry.count({ where: { guideId } }),
        this.prisma.tourInquiry.count({
          where: { guideId, status: { in: ['new', 'responded', 'priority'] } },
        }),
        this.prisma.tourInquiry.count({ where: { guideId, status: 'new' } }),
        this.prisma.tourInquiry.count({
          where: { guideId, status: 'priority' },
        }),
        this.prisma.tourInquiry.count({
          where: { guideId, status: 'responded' },
        }),
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
      throw new BadRequestException(
        'Inquiry is already converted to a booking',
      );
    }

    // Try to find the associated package
    // We match by tourInterest since public inquiry sets tourInterest = pkg.name
    const pkg = await this.prisma.tourPackage.findFirst({
      where: { guideId, name: inquiry.tourInterest },
    });

    if (!pkg) {
      throw new NotFoundException(
        `Tour package "${inquiry.tourInterest}" not found.`,
      );
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
  //  NOTIFICATIONS (Now handled globally in NotificationsService)
  // ══════════════════════════════════════════════════════════════════════════

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
      this.prisma.tourBooking.count({
        where: { guideId, status: 'confirmed' },
      }),
      this.prisma.tourBooking.count({ where: { guideId, status: 'pending' } }),
      this.prisma.tourBooking.count({
        where: { guideId, status: 'completed' },
      }),
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
    const monthlyTrend: {
      label: string;
      total: number;
      month: number;
      year: number;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
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
          totalRevenue > 0
            ? Math.round((amount / totalRevenue) * 1000) / 10
            : 0,
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

  // ══════════════════════════════════════════════════════════════════════════
  //  INSIGHTS
  // ══════════════════════════════════════════════════════════════════════════

  async getInsights(guideId: string) {
    // 1. Funnel Pipeline Data
    const totalInquiries = await this.prisma.tourInquiry.count({
      where: { guideId },
    });

    // Fallback heuristic for website visits (since not tracked directly)
    const websiteVisits = totalInquiries > 0 ? totalInquiries * 4 + 1420 : 0;

    const confirmedBookings = await this.prisma.tourBooking.count({
      where: { guideId, status: { in: ['confirmed', 'completed'] } },
    });

    const completedBookings = await this.prisma.tourBooking.count({
      where: { guideId, status: 'completed' },
    });

    // Compute Conversion Rates
    const inquiryRate = websiteVisits > 0 ? totalInquiries / websiteVisits : 0;
    const bookingRate =
      totalInquiries > 0 ? confirmedBookings / totalInquiries : 0;
    const completionRate =
      confirmedBookings > 0 ? completedBookings / confirmedBookings : 0;

    const funnelSteps = [
      {
        label: 'Website Visits',
        value: websiteVisits.toLocaleString(),
        fillPercent: 1.0,
        icon: 'eye-outline',
        color: '#0E5E2F',
        bgColor: '#EAF7EE',
        conversionRate: null,
      },
      {
        label: 'Inquiries',
        value: totalInquiries.toLocaleString(),
        fillPercent: inquiryRate,
        icon: 'chatbubble-ellipses-outline',
        color: '#D97706',
        bgColor: '#FFFBEB',
        conversionRate: `${(inquiryRate * 100).toFixed(1)}% Inquiry Rate`,
      },
      {
        label: 'Confirmed',
        value: confirmedBookings.toLocaleString(),
        fillPercent: bookingRate,
        icon: 'wallet-outline',
        color: '#2563EB',
        bgColor: '#EFF6FF',
        conversionRate: `${(bookingRate * 100).toFixed(1)}% Booking Rate`,
      },
      {
        label: 'Completed',
        value: completedBookings.toLocaleString(),
        fillPercent: completionRate,
        icon: 'checkmark-circle-outline',
        color: '#10B981',
        bgColor: '#ECFDF5',
        conversionRate: `${(completionRate * 100).toFixed(1)}% Trip Completion`,
      },
    ];

    // 2. Conversion Trend Data (Mocked but structured for UI)
    // Normally this would query bookings group by day
    const conversionTrend30Days = Array.from({ length: 10 }).map((_, i) => ({
      heightPercent: Math.floor(Math.random() * 70) + 30,
      isActive: i % 4 === 2,
    }));

    const conversionTrend90Days = Array.from({ length: 10 }).map((_, i) => ({
      heightPercent: Math.floor(Math.random() * 60) + 40,
      isActive: i % 3 === 1,
    }));

    // 3. Top Converting Packages
    const packages = await this.prisma.tourPackage.findMany({
      where: { guideId },
      include: {
        bookings: { select: { id: true } },
      },
    });

    const topPackagesResult = packages.map((pkg) => {
      // Find inquiries matching package name loosely, or just count all inquiries if unlinked
      // For MVP, we'll use a mocked heuristic for inquiries based on bookings if no strict relation exists
      const inquiriesCount =
        pkg.bookings.length * 3 + Math.floor(Math.random() * 10);
      const bookingsCount = pkg.bookings.length;
      const conversionRate =
        inquiriesCount > 0 ? bookingsCount / inquiriesCount : 0;

      return {
        name: pkg.name,
        duration: pkg.duration,
        inquiriesCount,
        bookingsCount,
        conversionRate: Math.round(conversionRate * 100),
      };
    });

    const topPackages = topPackagesResult
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 5); // Top 5 packages

    // 4. Global Conversion Stats
    const globalConversionRate =
      bookingRate > 0 ? Number((bookingRate * 100).toFixed(1)) : 22.4;

    // Trend Calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const inquiriesLast30 = await this.prisma.tourInquiry.count({
      where: { guideId, createdAt: { gte: thirtyDaysAgo } },
    });
    const inquiriesPrev30 = await this.prisma.tourInquiry.count({
      where: { guideId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    });

    let trendPercent = 3.2; // default fallback
    if (inquiriesPrev30 > 0) {
      trendPercent = Number(
        (((inquiriesLast30 - inquiriesPrev30) / inquiriesPrev30) * 100).toFixed(
          1,
        ),
      );
    }
    const globalConversionTrend = `${trendPercent >= 0 ? '+' : ''}${trendPercent}% from last month`;

    // Sparkline Calculation (last 42 days)
    const sparklineDays = 42;
    const sparklineStartDate = new Date();
    sparklineStartDate.setDate(sparklineStartDate.getDate() - sparklineDays);

    const recentBookingsForSparkline = await this.prisma.tourBooking.findMany({
      where: {
        guideId,
        createdAt: { gte: sparklineStartDate },
      },
      select: { createdAt: true },
    });

    const bookingsByDay: number[] = Array.from(
      { length: sparklineDays },
      () => 0,
    );
    const nowTime = new Date().getTime();
    recentBookingsForSparkline.forEach((b) => {
      const diffTime = nowTime - new Date(b.createdAt).getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < sparklineDays) {
        bookingsByDay[sparklineDays - 1 - diffDays]++;
      }
    });

    const maxBookingsPerDay = Math.max(...bookingsByDay, 1);
    let sparklineData: number[];
    if (recentBookingsForSparkline.length > 0) {
      sparklineData = bookingsByDay.map((count) =>
        Math.round((count / maxBookingsPerDay) * 100),
      );
    } else {
      // Fallback for visual demo if account has zero bookings
      sparklineData = [
        5, 6, 7, 9, 11, 14, 17, 20, 22, 24, 25, 25, 24, 23, 21, 18, 16, 14, 13,
        12, 12, 13, 14, 16, 18, 21, 25, 30, 36, 43, 52, 62, 73, 85, 94, 99, 100,
        95, 80, 50, 20, 0,
      ];
    }

    return {
      funnelSteps,
      conversionTrend30Days,
      conversionTrend90Days,
      topPackages,
      globalConversionRate,
      globalConversionTrend,
      sparklineData,
    };
  }
}
