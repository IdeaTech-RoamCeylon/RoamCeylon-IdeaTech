/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger(AdminUsersService.name);

  async getMe(userId: string) {
    // TODO: Run 'npx prisma generate' to update types. Casting to any temporarily.
    let user = (await this.prisma.adminUser.findUnique({
      where: { id: userId },
    })) as any;

    if (!user) {
      this.logger.log(
        `Auto-creating missing admin_users profile for Nhost ID: ${userId}`,
      );
      user = (await this.prisma.adminUser.create({
        data: {
          id: userId,
          role: 'hotel_manager', // Default role, will be updated on first profile sync
        },
      })) as any;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(userId: string, updateDto: UpdateAdminUserDto) {
    try {
      const user = (await this.prisma.adminUser.update({
        where: { id: userId },
        data: updateDto,
      })) as any;

      this.logger.log(`Admin user profile updated for ID: ${userId}`);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      if ((error as any).code === 'P2025') {
        this.logger.warn(
          `Failed to update profile. Admin user not found for ID: ${userId}`,
        );
        throw new NotFoundException('Admin user not found');
      }
      throw error;
    }
  }

  /**
   * Sync admin user profile on first login.
   * Creates the admin_users row if it doesn't exist, or updates it.
   */
  async syncProfile(
    userId: string,
    data: {
      name?: string;
      email?: string;
      phoneNumber?: string;
      role?: string;
    },
  ) {
    const existing = (await this.prisma.adminUser.findUnique({
      where: { id: userId },
    })) as any;

    if (existing) {
      // Update with any new data
      const updateData: Record<string, string> = {};
      if (data.name && !existing.name) updateData.name = data.name;
      if (data.email && !existing.email) updateData.email = data.email;
      if (data.phoneNumber && !existing.phoneNumber)
        updateData.phoneNumber = data.phoneNumber;
      if (data.role) updateData.role = data.role;

      if (Object.keys(updateData).length > 0) {
        return this.prisma.adminUser.update({
          where: { id: userId },
          data: updateData,
        });
      }
      return existing;
    }

    return this.prisma.adminUser.create({
      data: {
        id: userId,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        role: data.role || 'hotel_manager',
      },
    });
  }
}
