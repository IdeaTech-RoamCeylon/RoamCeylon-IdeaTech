import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

export type ShopStatus = 'active' | 'under_review' | 'inactive';

@Injectable()
export class ShopsService {
  private readonly logger = new Logger(ShopsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── List all shops (admin view) ───────────────────────────────────────────

  async findAll(status?: ShopStatus) {
    return this.prisma.shop.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── List shops owned by a specific partner ────────────────────────────────

  async findByOwner(ownerId: string) {
    return this.prisma.shop.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Get a single shop ─────────────────────────────────────────────────────

  async findOne(id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException(`Shop "${id}" not found`);
    return shop;
  }

  // ── Create a new shop ─────────────────────────────────────────────────────

  async create(ownerId: string, dto: CreateShopDto) {
    const shop = await this.prisma.shop.create({
      data: {
        ownerId,
        name: dto.name,
        category: dto.category,
        description: dto.description ?? '',
        coverImageUrl: dto.coverImageUrl ?? '',
        status: 'under_review',
        hoursEnabled: dto.hoursEnabled ?? false,
        hoursText: dto.hoursText ?? '',
        website: dto.website ?? '',
        instagram: dto.instagram ?? '',
        facebook: dto.facebook ?? '',
        tiktok: dto.tiktok ?? '',
        location: dto.location ?? '',
      },
    });
    this.logger.log(`Created shop "${shop.name}" (${shop.id}) for owner ${ownerId}`);
    return shop;
  }

  // ── Update a shop ─────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateShopDto, requesterId: string, isAdmin = false) {
    const existing = await this.prisma.shop.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Shop "${id}" not found`);
    if (!isAdmin && existing.ownerId !== requesterId) {
      throw new ForbiddenException('You do not own this shop');
    }

    const shop = await this.prisma.shop.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        category: dto.category ?? existing.category,
        description: dto.description ?? existing.description,
        coverImageUrl: dto.coverImageUrl ?? existing.coverImageUrl,
        hoursEnabled: dto.hoursEnabled ?? existing.hoursEnabled,
        hoursText: dto.hoursText ?? existing.hoursText,
        website: dto.website ?? existing.website,
        instagram: dto.instagram ?? existing.instagram,
        facebook: dto.facebook ?? existing.facebook,
        tiktok: dto.tiktok ?? existing.tiktok,
        location: dto.location ?? existing.location,
      },
    });
    this.logger.log(`Updated shop "${shop.name}" (${id})`);
    return shop;
  }

  // ── Delete a shop ─────────────────────────────────────────────────────────

  async remove(id: string, requesterId: string, isAdmin = false) {
    const existing = await this.prisma.shop.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Shop "${id}" not found`);
    if (!isAdmin && existing.ownerId !== requesterId) {
      throw new ForbiddenException('You do not own this shop');
    }

    await this.prisma.shop.delete({ where: { id } });
    this.logger.log(`Deleted shop "${existing.name}" (${id})`);
    return { message: `Shop "${existing.name}" deleted successfully` };
  }

  // ── Update shop status (admin only) ───────────────────────────────────────

  async updateStatus(id: string, status: ShopStatus) {
    const existing = await this.prisma.shop.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Shop "${id}" not found`);

    const shop = await this.prisma.shop.update({
      where: { id },
      data: { status },
    });
    this.logger.log(`Shop ${id} status → "${status}"`);
    return shop;
  }

  // ── Dashboard stats ───────────────────────────────────────────────────────

  async getStats() {
    const [total, active, underReview, inactive] = await Promise.all([
      this.prisma.shop.count(),
      this.prisma.shop.count({ where: { status: 'active' } }),
      this.prisma.shop.count({ where: { status: 'under_review' } }),
      this.prisma.shop.count({ where: { status: 'inactive' } }),
    ]);

    return { total, active, underReview, inactive, networkGrowthPercent: 0 };
  }
}
