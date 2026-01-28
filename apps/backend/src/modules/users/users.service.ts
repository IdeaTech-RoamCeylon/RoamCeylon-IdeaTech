import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      phoneNumber: user.phoneNumber,
      name: user.name,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      email: user.email,
      createdAt: user.createdAt,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
    });

    return {
      id: user.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      phoneNumber: user.phoneNumber,
      name: user.name,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      email: user.email,
      createdAt: user.createdAt,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      updatedAt: user.updatedAt,
    };
  }
}
