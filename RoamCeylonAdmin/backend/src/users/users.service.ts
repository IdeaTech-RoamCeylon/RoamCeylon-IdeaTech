import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private formatUser(user: Record<string, any> | null) {
    if (!user) return user;
    const formatted: Record<string, any> = { ...user };
    if ('phone' in formatted) {
      formatted.phoneNumber = formatted.phone as string;
      delete formatted.phone;
    }
    if ('is_local' in formatted) {
      formatted.isLocal = formatted.is_local as boolean;
      delete formatted.is_local;
    }
    return formatted;
  }

  async getUser(id: string) {
    let user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      // Auto-create user profile if it doesn't exist yet
      user = await this.prisma.user.create({ data: { id } });
      this.logger.log(`Auto-created user profile for ${id}`);
    }
    return this.formatUser(user);
  }

  async updateUser(id: string, data: Record<string, any>) {
    const updateData: Record<string, any> = { ...data };

    // Map frontend fields to Prisma schema fields
    if ('phoneNumber' in updateData) {
      updateData.phone = updateData.phoneNumber as string;
      delete updateData.phoneNumber;
    }
    if ('isLocal' in updateData) {
      updateData.is_local = updateData.isLocal as boolean;
      delete updateData.isLocal;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    return this.formatUser(updatedUser);
  }
}
