import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      // Empty string is required for native serverAuthCode flow (not browser-based OAuth)
      '',
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendOtp(_phoneNumber: string): { message: string } {
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(
    phoneNumber: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _otp: string,
  ): Promise<{
    accessToken: string;
    user: { id: string; phoneNumber: string };
  }> {
    // Create or update user in database
    const user = await this.prisma.user.upsert({
      where: { phoneNumber },
      update: {
        // Update timestamp will be automatically set by Prisma
      },
      create: {
        phoneNumber,
        // name and email will be added later in profile setup
      },
    });

    // Payload for JWT
    const payload = { username: phoneNumber, sub: user.id };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,

        phoneNumber: user.phoneNumber ?? '',
      },
    };
  }

  async googleSignIn(code: string): Promise<{
    accessToken: string;
    user: { id: string; email: string; name: string; googleId: string };
  }> {
    try {
      // Exchange authorization code for tokens
      const { tokens } = await this.googleClient.getToken(code);

      if (!tokens.id_token) {
        throw new UnauthorizedException('No ID token received from Google');
      }

      // Verify the ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const { sub: googleId, email, name, picture: profilePicture } = payload;

      if (!email || !googleId) {
        throw new UnauthorizedException('Missing required data from Google');
      }

      // Upsert user by googleId
      const user = await this.prisma.user.upsert({
        where: { googleId },
        update: {
          email,
          name,
          profilePicture,
          authProvider: 'google',
        },
        create: {
          googleId,
          email,
          name,
          profilePicture,
          authProvider: 'google',
        },
      });

      // Payload for JWT
      const jwtPayload = { username: email, sub: user.id };

      return {
        accessToken: this.jwtService.sign(jwtPayload),
        user: {
          id: user.id,
          email: user.email!,
          name: user.name!,
          googleId: user.googleId!,
        },
      };
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
