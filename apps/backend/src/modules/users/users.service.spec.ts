/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService - Validation Tests', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  describe('updateProfile - Birthday Validation', () => {
    it('should handle valid birthday correctly', async () => {
      const updateData: UpdateUserDto = {
        name: 'John Doe',
        birthday: '1990-01-15',
      };

      const mockUser = {
        id: 'user1',
        phoneNumber: '+94771234567',
        name: 'John Doe',
        email: 'john@example.com',
        birthday: new Date('1990-01-15'),
        gender: 'Male',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.updateProfile('user1', updateData);

      expect(result.birthday).toEqual(mockUser.birthday);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: expect.objectContaining({
          birthday: new Date('1990-01-15'),
        }),
      });
    });

    it('should handle optional fields correctly', async () => {
      const updateData: UpdateUserDto = {
        name: 'Jane Doe',
      };

      const mockUser = {
        id: 'user1',
        phoneNumber: '+94771234567',
        name: 'Jane Doe',
        email: 'jane@example.com',
        birthday: null,
        gender: 'Female',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.updateProfile('user1', updateData);

      expect(result.name).toBe('Jane Doe');
    });
  });

  describe('getMe - Error Handling', () => {
    it('should throw NotFoundException when user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getMe('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getMe('nonexistent')).rejects.toThrow(
        'User not found',
      );
    });

    it('should return user data when found', async () => {
      const mockUser = {
        id: 'user1',
        phoneNumber: '+94771234567',
        name: 'Test User',
        email: 'test@example.com',
        birthday: new Date('1995-05-20'),
        gender: 'Other',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getMe('user1');

      expect(result).toEqual({
        id: 'user1',
        phoneNumber: '+94771234567',
        name: 'Test User',
        email: 'test@example.com',
        birthday: mockUser.birthday,
        gender: 'Other',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });
  });

  describe('updateProfile - Error Handling', () => {
    it('should throw NotFoundException when user not found (P2025 error)', async () => {
      const updateData: UpdateUserDto = {
        name: 'Updated Name',
      };

      const prismaError = new Error('Record not found');
      (prismaError as any).code = 'P2025';

      (prismaService.user.update as jest.Mock).mockRejectedValue(prismaError);

      await expect(service.updateProfile('user1', updateData)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateProfile('user1', updateData)).rejects.toThrow(
        'User not found',
      );
    });

    it('should rethrow other errors', async () => {
      const updateData: UpdateUserDto = {
        email: 'newemail@example.com',
      };

      const genericError = new Error('Database connection failed');

      (prismaService.user.update as jest.Mock).mockRejectedValue(genericError);

      await expect(service.updateProfile('user1', updateData)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
