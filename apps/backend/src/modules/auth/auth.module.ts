import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

/**
 * AuthModule — wires up the Passport JWT strategy.
 *
 * JwtModule is NOT imported here because the backend no longer signs its own
 * JWTs. All tokens are issued by Nhost Hasura Auth and verified via
 * JwtStrategy + passport-jwt using NHOST_JWT_SECRET from the environment.
 *
 * To protect a route in any other module:
 *
 *   import { AuthGuard } from '@nestjs/passport';
 *
 *   @UseGuards(AuthGuard('jwt'))
 *   @Get('protected')
 *   getProtected(@Request() req) {
 *     // req.user = { userId, role, allowedRoles } from JwtStrategy.validate()
 *   }
 *
 * Or create a reusable guard (recommended):
 *
 *   // src/common/guards/jwt-auth.guard.ts
 *   import { Injectable } from '@nestjs/common';
 *   import { AuthGuard } from '@nestjs/passport';
 *   @Injectable()
 *   export class JwtAuthGuard extends AuthGuard('jwt') {}
 */
@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
