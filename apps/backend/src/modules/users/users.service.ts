/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger(UsersService.name);

  async getMe(userId: string) {
    // TODO: Run 'npx prisma generate' to update types. Casting to any temporarily.
    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
    })) as any;

    if (!user) {
      this.logger.warn(`User found for ID: ${userId}`);
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,

      phoneNumber: user.phoneNumber,
      name: user.name,

      email: user.email,
      birthday: user.birthday,
      gender: user.gender,
      createdAt: user.createdAt,

      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    try {
      const data: any = { ...updateUserDto };
      if (updateUserDto.birthday) {
        data.birthday = new Date(updateUserDto.birthday);
      }

      const user = (await this.prisma.user.update({
        where: { id: userId },
        data,
      })) as any;

      this.logger.log(`User profile updated for ID: ${userId}`);

      return {
        id: user.id,

        phoneNumber: user.phoneNumber,
        name: user.name,

        email: user.email,
        birthday: user.birthday,
        gender: user.gender,
        createdAt: user.createdAt,

        updatedAt: user.updatedAt,
      };
    } catch (error) {
      if (error.code === 'P2025') {
        this.logger.warn(
          `Failed to update profile. User not found for ID: ${userId}`,
        );
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
}
