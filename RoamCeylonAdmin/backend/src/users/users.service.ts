import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private formatUser(user: any) {
    if (!user) return user;
    const formatted = { ...user };
    if ('phone' in formatted) {
      formatted.phoneNumber = formatted.phone;
      delete formatted.phone;
    }
    if ('is_local' in formatted) {
      formatted.isLocal = formatted.is_local;
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

  async updateUser(id: string, data: any) {
    const updateData: any = { ...data };
    
    // Map frontend fields to Prisma schema fields
    if ('phoneNumber' in updateData) {
      updateData.phone = updateData.phoneNumber;
      delete updateData.phoneNumber;
    }
    if ('isLocal' in updateData) {
      updateData.is_local = updateData.isLocal;
      delete updateData.isLocal;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    return this.formatUser(updatedUser);
  }
}
