import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AdminUser {
  id: string;
  userId: string; // Used for frontend state mapping (sub claim)
  email: string | null;
  name: string | null;
  phoneNumber: string | null;
  profile_picture: string | null;
  role: string;
  preferences: any;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upserts the admin user record on every login.
   * If the user already exists, merges non-empty fields.
   */
  async sync(
    userId: string, // Nhost sub claim
    dto: { email?: string; name?: string; phoneNumber?: string; role?: string; profile_picture?: string; preferences?: any },
  ) {
    // 1. Try to find existing by email or phone (since they are unique in DB)
    // For admin app, we generally assume email is the primary identifier if userId isn't an exact match.
    // However, the Nhost userId might be what is stored in the `id` field of the AdminUser table in the main backend,
    // or it might just be the email. Let's try finding by ID first.
    
    let existing = await this.prisma.adminUser.findUnique({
      where: { id: userId },
    });

    if (!existing && dto.email) {
      existing = await this.prisma.adminUser.findUnique({
        where: { email: dto.email },
      });
    }

    // System roles from Nhost JWT (e.g. 'user', 'me') should never overwrite
    // a real app role already stored in the DB.
    const SYSTEM_ROLES = ['user', 'me', 'anonymous', 'public'];
    const isRealRole = (role?: string) => !!role && !SYSTEM_ROLES.includes(role);

    if (existing) {
      const updated = await this.prisma.adminUser.update({
        where: { id: existing.id },
        data: {
          email: dto.email || existing.email,
          name: dto.name || existing.name,
          phoneNumber: dto.phoneNumber || existing.phoneNumber,
          profile_picture: dto.profile_picture || existing.profile_picture,
          preferences: dto.preferences || existing.preferences,
          // Only update role if incoming is a real app role; never downgrade to a system role
          role: isRealRole(dto.role) ? dto.role : existing.role,
        },
      });
      this.logger.log(`Admin user updated: ${updated.email} (role: ${updated.role})`);
      return { ...updated, userId: updated.id };
    }

    // 2. Create new if not found
    const created = await this.prisma.adminUser.create({
      data: {
        id: userId,
        email: dto.email || null,
        name: dto.name || null,
        phoneNumber: dto.phoneNumber || null,
        profile_picture: dto.profile_picture || null,
        role: dto.role || 'shop_partner',
        preferences: dto.preferences || null,
      },
    });
    
    this.logger.log(`Admin user created: ${created.email} (role: ${created.role})`);
    return { ...created, userId: created.id };
  }

  async findById(userId: string) {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
    });
    return user ? { ...user, userId: user.id } : undefined;
  }

  async updateProfile(
    userId: string,
    dto: { name?: string; phoneNumber?: string; profile_picture?: string; preferences?: any },
  ) {
    const updated = await this.prisma.adminUser.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
        ...(dto.profile_picture !== undefined && { profile_picture: dto.profile_picture }),
        ...(dto.preferences !== undefined && { preferences: dto.preferences }),
      },
    });
    this.logger.log(`Admin user profile updated: ${updated.email}`);
    return { ...updated, userId: updated.id };
  }

  async findAll() {
    const users = await this.prisma.adminUser.findMany();
    return users.map(user => ({ ...user, userId: user.id }));
  }
}
