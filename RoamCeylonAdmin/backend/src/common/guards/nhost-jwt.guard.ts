import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * NhostJwtGuard
 *
 * Validates the Nhost-issued JWT Bearer token on protected routes.
 * Extracts the `sub` (userId) claim and attaches it to `req.user`.
 *
 * In production, verify the token against Nhost's JWKS endpoint.
 * For now we do a basic decode-only check so the admin app can be
 * tested without a separate JWT verification server.
 */
@Injectable()
export class NhostJwtGuard implements CanActivate {
  private readonly logger = new Logger(NhostJwtGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: any }>();
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    const token = authHeader.slice(7);

    try {
      // Decode the JWT payload (base64url middle segment) without verifying signature.
      // TODO: verify signature against Nhost JWKS for production hardening.
      const payloadB64 = token.split('.')[1];
      if (!payloadB64) throw new Error('Invalid token structure');

      const payload = JSON.parse(
        Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
      );

      const userId: string = payload.sub;
      const role: string =
        payload['https://hasura.io/jwt/claims']?.['x-hasura-default-role'] ??
        payload.role ??
        '';

      if (!userId) throw new Error('No subject claim in token');

      req.user = { userId, role };
      return true;
    } catch (err) {
      this.logger.warn(`JWT decode failed: ${err.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
