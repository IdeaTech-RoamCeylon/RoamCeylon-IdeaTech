import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { VerificationService } from './verification.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import { NhostJwtGuard } from '../common/guards/nhost-jwt.guard';

interface AuthRequest extends Request {
  user: { userId: string; role: string };
}

/**
 * VerificationController
 *
 * Base path: /verification
 *
 * Partner (requires JWT):
 *   GET  /verification/me      — current user's verification record
 *   POST /verification/upload  — upload a document to the "Admin Details" bucket
 *   POST /verification/submit  — submit the three document URLs for review
 *
 * Reviewer (admin panel — unauthenticated, matching the panel's current model):
 *   GET   /verification                 — list submissions (?status=pending)
 *   PATCH /verification/:userId/approve  — approve a submission
 *   PATCH /verification/:userId/reject   — reject a submission (optional reason)
 */
@Controller('verification')
export class VerificationController {
  private readonly logger = new Logger(VerificationController.name);

  constructor(private readonly verificationService: VerificationService) {}

  // ── Partner: own verification status ─────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Get('me')
  getMine(@Req() req: AuthRequest) {
    return this.verificationService.findByUser(req.user.userId);
  }

  // ── Partner: upload a document (proxy to Nhost Storage) ──────────────────

  @UseGuards(NhostJwtGuard)
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  upload(@Body() dto: UploadFileDto) {
    return this.verificationService.uploadFile(
      dto.base64,
      dto.mimeType,
      dto.fileName,
    );
  }

  // ── Partner: submit / resubmit for review ────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  submit(@Req() req: AuthRequest, @Body() dto: SubmitVerificationDto) {
    this.logger.log(`Verification submit by ${req.user.userId}`);
    return this.verificationService.submit(req.user.userId, dto);
  }

  // ── Reviewer (admin panel): list submissions ─────────────────────────────

  @Get()
  async list(@Query('status') status?: string) {
    const data = await this.verificationService.findAll(status);
    return { data };
  }

  // ── Reviewer: approve ────────────────────────────────────────────────────

  @Patch(':userId/approve')
  async approve(@Param('userId') userId: string) {
    const data = await this.verificationService.approve(userId);
    return { data };
  }

  // ── Reviewer: reject ─────────────────────────────────────────────────────

  @Patch(':userId/reject')
  async reject(
    @Param('userId') userId: string,
    @Body() dto: RejectVerificationDto,
  ) {
    const data = await this.verificationService.reject(userId, dto.reason);
    return { data };
  }
}
