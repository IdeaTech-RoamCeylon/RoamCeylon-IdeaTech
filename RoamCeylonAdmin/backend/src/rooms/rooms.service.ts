import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

export type RoomStatus = 'available' | 'booked' | 'maintenance';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

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
    formData.append('file[]', blob, `room_${Date.now()}.jpg`);

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

  // ── List rooms owned by a specific partner ────────────────────────────────

  async findByOwner(ownerId: string) {
    return this.prisma.room.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Get a single room ─────────────────────────────────────────────────────

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException(`Room "${id}" not found`);
    return room;
  }

  // ── Create a new room ─────────────────────────────────────────────────────

  async create(ownerId: string, dto: CreateRoomDto) {
    // Auto-link the room to the owner's hotel if they have one.
    const hotel = await this.prisma.hotel.findUnique({ where: { ownerId } });

    const room = await this.prisma.room.create({
      data: {
        ownerId,
        hotelId: hotel?.id ?? null,
        name: dto.name,
        roomType: dto.roomType ?? '',
        squareFootage: dto.squareFootage ?? 0,
        adults: dto.adults ?? 2,
        availableUnits: dto.availableUnits ?? 1,
        nightlyRate: dto.nightlyRate ?? 0,
        amenities: (dto.amenities ?? []) as Prisma.InputJsonValue,
        coverImageUrl: dto.coverImageUrl ?? '',
        galleryUrls: (dto.galleryUrls ?? []) as Prisma.InputJsonValue,
        status: dto.status ?? 'available',
      },
    });
    this.logger.log(
      `Created room "${room.name}" (${room.id}) for owner ${ownerId}`,
    );
    return room;
  }

  // ── Update a room ─────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateRoomDto,
    requesterId: string,
    isAdmin = false,
  ) {
    const existing = await this.prisma.room.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Room "${id}" not found`);
    if (!isAdmin && existing.ownerId !== requesterId) {
      throw new ForbiddenException('You do not own this room');
    }

    const room = await this.prisma.room.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        roomType: dto.roomType ?? existing.roomType,
        squareFootage: dto.squareFootage ?? existing.squareFootage,
        adults: dto.adults ?? existing.adults,
        availableUnits: dto.availableUnits ?? existing.availableUnits,
        nightlyRate: dto.nightlyRate ?? existing.nightlyRate,
        amenities: (dto.amenities ??
          (existing.amenities as Prisma.InputJsonValue)) as Prisma.InputJsonValue,
        coverImageUrl: dto.coverImageUrl ?? existing.coverImageUrl,
        galleryUrls: (dto.galleryUrls ??
          (existing.galleryUrls as Prisma.InputJsonValue)) as Prisma.InputJsonValue,
        status: dto.status ?? existing.status,
      },
    });
    this.logger.log(`Updated room "${room.name}" (${id})`);
    return room;
  }

  // ── Delete a room ─────────────────────────────────────────────────────────

  async remove(id: string, requesterId: string, isAdmin = false) {
    const existing = await this.prisma.room.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Room "${id}" not found`);
    if (!isAdmin && existing.ownerId !== requesterId) {
      throw new ForbiddenException('You do not own this room');
    }

    await this.prisma.room.delete({ where: { id } });
    this.logger.log(`Deleted room "${existing.name}" (${id})`);
    return { message: `Room "${existing.name}" deleted successfully` };
  }

  // ── Update room status ────────────────────────────────────────────────────

  async updateStatus(id: string, status: RoomStatus) {
    const existing = await this.prisma.room.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Room "${id}" not found`);

    const room = await this.prisma.room.update({
      where: { id },
      data: { status },
    });
    this.logger.log(`Room ${id} status → "${status}"`);
    return room;
  }
}
