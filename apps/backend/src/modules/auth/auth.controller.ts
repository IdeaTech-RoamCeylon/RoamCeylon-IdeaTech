import { Controller, Logger } from '@nestjs/common';

/**
 * AuthController — placeholder after Nhost migration.
 *
 * All authentication (Google Sign-In, Phone OTP, Email) is now handled entirely
 * by Nhost Hasura Auth on the frontend. The NestJS backend no longer exposes
 * any auth endpoints for user sign-in or token exchange.
 *
 * Routes that were previously here:
 *  - POST /auth/send-otp  → removed (Nhost handles SMS OTP)
 *  - POST /auth/verify-otp → removed (Nhost handles SMS OTP verification)
 *  - POST /auth/google    → removed (Nhost handles Google ID token sign-in)
 *
 * Protected routes in other modules use @UseGuards(JwtAuthGuard) to validate
 * the Nhost-issued JWT from the Authorization: Bearer header.
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
}
