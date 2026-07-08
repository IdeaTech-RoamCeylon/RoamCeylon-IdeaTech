import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';

@Injectable()
export class HotelsService {
  private readonly logger = new Logger(HotelsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Upload image to Nhost Storage via admin secret (bucket: Hotels) ────────

  async uploadImage(
    base64: string,
    mimeType: string = 'image/jpeg',
  ): Promise<{ url: string }> {
    const subdomain = process.env.NHOST_SUBDOMAIN;
    const region = process.env.NHOST_REGION;
    const adminSecret = process.env.NHOST_ADMIN_SECRET;
    const storageUrl = `https://${subdomain}.storage.${region}.nhost.run/v1/files`;

    const buffer = Buffer.from(base64, 'base64');
    const blob = new Blob([buffer], { type: mimeType });

    const formData = new FormData();
    formData.append('bucket-id', 'Hotels');
    formData.append('file[]', blob, `hotel_${Date.now()}.jpg`);

    const response = await fetch(storageUrl, {
      method: 'POST',
      headers: { 'x-hasura-admin-secret': adminSecret! },
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
    return { url: `${storageUrl}/${fileId}` };
  }

  // ── Get the owner's hotel (one per provider) ──────────────────────────────

  async findByOwner(ownerId: string) {
    return this.prisma.hotel.findUnique({ where: { ownerId } });
  }

  // ── Get a single hotel ────────────────────────────────────────────────────

  async findOne(id: string) {
    const hotel = await this.prisma.hotel.findUnique({ where: { id } });
    if (!hotel) throw new NotFoundException(`Hotel "${id}" not found`);
    return hotel;
  }

  // ── Create or update the owner's hotel ────────────────────────────────────

  async upsertForOwner(ownerId: string, dto: CreateHotelDto) {
    const data = {
      name: dto.name,
      category: dto.category ?? '',
      description: dto.description ?? '',
      streetAddress: dto.streetAddress ?? '',
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      amenities: (dto.amenities ?? []) as Prisma.InputJsonValue,
      coverImageUrl: dto.coverImageUrl ?? '',
      galleryUrls: (dto.galleryUrls ?? []) as Prisma.InputJsonValue,
    };

    const hotel = await this.prisma.hotel.upsert({
      where: { ownerId },
      create: { ownerId, ...data },
      update: data,
    });
    this.logger.log(`Upserted hotel "${hotel.name}" (${hotel.id}) for owner ${ownerId}`);
    return hotel;
  }

  // ── Update a hotel by id ──────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateHotelDto,
    requesterId: string,
    isAdmin = false,
  ) {
    const existing = await this.prisma.hotel.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Hotel "${id}" not found`);
    if (!isAdmin && existing.ownerId !== requesterId) {
      throw new ForbiddenException('You do not own this hotel');
    }

    const hotel = await this.prisma.hotel.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        category: dto.category ?? existing.category,
        description: dto.description ?? existing.description,
        streetAddress: dto.streetAddress ?? existing.streetAddress,
        latitude: dto.latitude ?? existing.latitude,
        longitude: dto.longitude ?? existing.longitude,
        amenities: (dto.amenities ??
          (existing.amenities as Prisma.InputJsonValue)) as Prisma.InputJsonValue,
        coverImageUrl: dto.coverImageUrl ?? existing.coverImageUrl,
        galleryUrls: (dto.galleryUrls ??
          (existing.galleryUrls as Prisma.InputJsonValue)) as Prisma.InputJsonValue,
      },
    });
    this.logger.log(`Updated hotel "${hotel.name}" (${id})`);
    return hotel;
  }
}
