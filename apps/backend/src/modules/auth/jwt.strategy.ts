import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Hasura JWT payload structure.
 *
 * Nhost / Hasura Auth issues JWTs with standard claims plus a
 * `https://hasura.io/jwt/claims` namespace containing Hasura-specific
 * role and user-id claims.
 */
interface HasuraJwtPayload {
  sub: string; // Nhost user UUID
  iat?: number;
  exp?: number;
  'https://hasura.io/jwt/claims': {
    'x-hasura-user-id': string;
    'x-hasura-default-role': string;
    'x-hasura-allowed-roles': string[];
    [key: string]: string | string[];
  };
}

/**
 * Passport strategy that validates Nhost-issued JWTs.
 *
 * Configuration:
 *  - Reads NHOST_JWT_SECRET from env. This is a JSON string in the form:
 *    {"type":"HS256","key":"<actual-secret>"}
 *    Copy the value from Nhost Dashboard → Settings → Secrets →
 *    HASURA_GRAPHQL_JWT_SECRET.
 *  - Extracts the token from the Authorization: Bearer <token> header.
 *  - Validates the algorithm and expiry automatically via passport-jwt.
 *
 * The backend no longer issues its own JWTs or handles the Google OAuth
 * handshake — that is entirely delegated to Nhost Hasura Auth.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  constructor(configService: ConfigService) {
    // NHOST_JWT_SECRET is a JSON string: {"type":"HS256","key":"<secret>"}
    const rawSecret = configService.get<string>('NHOST_JWT_SECRET');
    if (!rawSecret) {
      throw new Error(
        'NHOST_JWT_SECRET is not set. Copy it from Nhost Dashboard → Settings → Secrets → HASURA_GRAPHQL_JWT_SECRET.',
      );
    }

    let jwtSecret: { type: string; key: string };
    try {
      jwtSecret = JSON.parse(rawSecret) as { type: string; key: string };
    } catch {
      throw new Error(
        'NHOST_JWT_SECRET must be a valid JSON string, e.g. {"type":"HS256","key":"<your-secret>"}',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret.key,
      algorithms: [jwtSecret.type], // e.g. ['HS256'] — prevents algorithm switching attacks
    });
  }
  /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

  /**
   * Called by Passport after the JWT signature is verified.
   *
   * Extracts the Nhost user ID from the Hasura claims namespace and
   * attaches it to req.user so route handlers can access it.
   *
   * @param payload - Decoded, verified JWT payload from Nhost
   */
  validate(payload: HasuraJwtPayload) {
    const hasuraClaims = payload['https://hasura.io/jwt/claims'];
    if (!hasuraClaims) {
      throw new UnauthorizedException('Token missing Hasura claims');
    }

    return {
      // Use the Hasura-specific user ID (same as payload.sub for Nhost)
      userId: hasuraClaims['x-hasura-user-id'] || payload.sub,
      role: hasuraClaims['x-hasura-default-role'],
      allowedRoles: hasuraClaims['x-hasura-allowed-roles'],
    };
  }
}
