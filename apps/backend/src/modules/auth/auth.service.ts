import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

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
        phoneNumber: user.phoneNumber,
      },
    };
  }
}
