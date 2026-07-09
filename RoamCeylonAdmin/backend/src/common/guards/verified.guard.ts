import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { VerificationService } from '../../verification/verification.service';

/**
 * VerifiedGuard
 *
 * Blocks "add" (create) operations unless the account's business
 * verification has been approved. Must run *after* NhostJwtGuard so
 * `req.user` is populated, e.g.:
 *
 *   @UseGuards(NhostJwtGuard, VerifiedGuard)
 *
 * `admin` / `super_admin` roles bypass the check. Otherwise a
 * ForbiddenException with the stable code BUSINESS_NOT_VERIFIED is
 * thrown so the mobile app can detect and prompt the user to verify.
 */
@Injectable()
export class VerifiedGuard implements CanActivate {
  constructor(private readonly verificationService: VerificationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: { userId: string; role: string } }>();

    const user = req.user;
    if (!user?.userId) {
      throw new ForbiddenException('BUSINESS_NOT_VERIFIED');
    }

    if (user.role === 'admin' || user.role === 'super_admin') {
      return true;
    }

    const approved = await this.verificationService.isApproved(user.userId);
    if (!approved) {
      throw new ForbiddenException({
        code: 'BUSINESS_NOT_VERIFIED',
        message:
          'Your business must be verified before you can add listings. Please complete verification in Settings.',
      });
    }

    return true;
  }
}
