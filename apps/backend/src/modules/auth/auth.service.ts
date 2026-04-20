import { Injectable } from '@nestjs/common';

/**
 * AuthService — stub after Nhost migration.
 *
 * All authentication logic (Google Sign-In, SMS OTP, user upsert) has been
 * removed. Nhost Hasura Auth now owns the entire authentication handshake.
 *
 * The NestJS backend's responsibility is limited to:
 *  1. Validating incoming Nhost JWTs (handled by JwtStrategy + JwtAuthGuard).
 *  2. Serving protected business-logic endpoints to authenticated users.
 *
 * If you need to look up or update user data based on the authenticated Nhost
 * user ID (available as req.user.userId from the JWT guard), use the
 * PrismaService directly in the relevant feature module's service.
 */
@Injectable()
export class AuthService {}
