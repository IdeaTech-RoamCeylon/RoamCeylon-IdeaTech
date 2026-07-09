import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitVerificationDto } from './dto/submit-verification.dto';

// Allowed document types and their file extensions.
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
};

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

// Nhost Storage bucket where verification documents are stored.
const VERIFICATION_BUCKET = 'Admin Details';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Upload a verification document to Nhost Storage ("Admin Details") ───────

  async uploadFile(
    base64: string,
    mimeType: string,
    fileName?: string,
  ): Promise<{ url: string }> {
    if (!base64) {
      throw new BadRequestException('Missing file data');
    }

    const ext = ALLOWED_TYPES[mimeType?.toLowerCase()];
    if (!ext) {
      throw new BadRequestException(
        'Unsupported file type. Allowed: png, jpg, jpeg, heic, pdf',
      );
    }

    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > MAX_FILE_BYTES) {
      throw new BadRequestException('File exceeds the 5 MB size limit');
    }

    const subdomain = process.env.NHOST_SUBDOMAIN;
    const region = process.env.NHOST_REGION;
    const adminSecret = process.env.NHOST_ADMIN_SECRET;
    const storageUrl = `https://${subdomain}.storage.${region}.nhost.run/v1/files`;

    const blob = new Blob([buffer], { type: mimeType });
    const safeName = (fileName ?? `verification_${Date.now()}`).replace(
      /[^a-zA-Z0-9._-]/g,
      '_',
    );

    const formData = new FormData();
    formData.append('bucket-id', VERIFICATION_BUCKET);
    formData.append('file[]', blob, `${safeName}.${ext}`);

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

    this.logger.log(`Verification document uploaded to Nhost Storage: ${fileId}`);
    return { url: `${storageUrl}/${fileId}` };
  }

  // ── Current user's verification record (or "none") ─────────────────────────

  async findByUser(userId: string) {
    const record = await this.prisma.businessVerification.findUnique({
      where: { userId },
    });
    return record ?? { status: 'none' };
  }

  // ── Submit / resubmit documents (moves back to "pending") ──────────────────

  async submit(userId: string, dto: SubmitVerificationDto) {
    const now = new Date();
    const record = await this.prisma.businessVerification.upsert({
      where: { userId },
      create: {
        userId,
        nicUrl: dto.nicUrl,
        businessLicenseUrl: dto.businessLicenseUrl,
        selfieUrl: dto.selfieUrl,
        status: 'pending',
        submittedAt: now,
      },
      update: {
        nicUrl: dto.nicUrl,
        businessLicenseUrl: dto.businessLicenseUrl,
        selfieUrl: dto.selfieUrl,
        status: 'pending',
        reviewNotes: null,
        reviewedAt: null,
        submittedAt: now,
      },
    });
    this.logger.log(`Verification submitted by ${userId}`);
    return record;
  }

  // ── Admin: list submissions (optionally filtered by status) ────────────────

  async findAll(status?: string) {
    const records = await this.prisma.businessVerification.findMany({
      where: status ? { status } : undefined,
      orderBy: { submittedAt: 'desc' },
    });

    // Enrich with the admin user's display info (no relation defined, so join manually).
    const userIds = records.map((r) => r.userId);
    const users = await this.prisma.adminUser.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return records.map((r) => ({
      ...r,
      user: userMap.get(r.userId) ?? null,
    }));
  }

  // ── Admin: approve ─────────────────────────────────────────────────────────

  async approve(userId: string) {
    await this.ensureExists(userId);
    const record = await this.prisma.businessVerification.update({
      where: { userId },
      data: { status: 'approved', reviewNotes: null, reviewedAt: new Date() },
    });
    this.logger.log(`Verification approved for ${userId}`);
    return record;
  }

  // ── Admin: reject (with optional reason) ───────────────────────────────────

  async reject(userId: string, reason?: string) {
    await this.ensureExists(userId);
    const record = await this.prisma.businessVerification.update({
      where: { userId },
      data: {
        status: 'rejected',
        reviewNotes: reason ?? null,
        reviewedAt: new Date(),
      },
    });
    this.logger.log(`Verification rejected for ${userId}`);
    return record;
  }

  // ── Guard helper: is this account approved? ────────────────────────────────

  async isApproved(userId: string): Promise<boolean> {
    const record = await this.prisma.businessVerification.findUnique({
      where: { userId },
      select: { status: true },
    });
    return record?.status === 'approved';
  }

  private async ensureExists(userId: string) {
    const existing = await this.prisma.businessVerification.findUnique({
      where: { userId },
    });
    if (!existing) {
      throw new NotFoundException(
        `No verification submission found for user "${userId}"`,
      );
    }
  }
}
