import { Test, TestingModule } from '@nestjs/testing';
import { HotelService } from './hotel.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

// Minimal fake hotel rows as they come back from Prisma (rooms included).
const HOTELS = [
  {
    id: 'h1',
    name: 'Amangalla Heritage Resort',
    category: 'Hotel',
    description: 'Historic Galle Fort stay',
    streetAddress: 'Galle',
    amenities: ['Spa', 'Pool'],
    coverImageUrl: 'https://example.com/h1.jpg',
    galleryUrls: [],
    status: 'active',
    rooms: [
      {
        id: 'r1',
        name: 'Garden Wing Room',
        roomType: 'Deluxe',
        adults: 2,
        nightlyRate: '18500',
        status: 'available',
      },
      {
        id: 'r2',
        name: 'Fort Heritage Suite',
        roomType: 'Suite',
        adults: 3,
        nightlyRate: '28000',
        status: 'available',
      },
    ],
  },
  {
    id: 'h2',
    name: '98 Acres Resort',
    category: 'Resort',
    description: 'Tea estate stay',
    streetAddress: 'Ella',
    amenities: ['Mountain Views'],
    coverImageUrl: '',
    galleryUrls: ['https://example.com/gallery.jpg'],
    status: 'active',
    rooms: [
      {
        id: 'r3',
        name: 'Standard Tea Chalet',
        roomType: 'Standard',
        adults: 2,
        nightlyRate: '16000',
        status: 'available',
      },
    ],
  },
];

describe('HotelService', () => {
  let service: HotelService;

  const prismaMock = {
    hotel: {
      findMany: jest.fn().mockResolvedValue(HOTELS),
      findUnique: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(HOTELS.find((h) => h.id === where.id) ?? null),
      ),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<HotelService>(HotelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSuggestedHotels', () => {
    it('returns all hotels when no destination is given (browse mode)', async () => {
      const results = await service.getSuggestedHotels('');
      expect(results.length).toBe(2);
    });

    it('maps DB rows to the consumer shape (price = lowest room, image fallback)', async () => {
      const results = await service.getSuggestedHotels('');
      const ella = results.find((h) => h.name === '98 Acres Resort')!;
      expect(ella.price).toBe(16000);
      expect(ella.destination).toBe('Ella');
      expect(ella.image).toBe('https://example.com/gallery.jpg'); // falls back to gallery
      expect(ella.rooms[0]).toEqual({
        type: 'Standard Tea Chalet',
        price: 16000,
        capacity: '2 Adults',
      });
    });

    it('filters by destination (case-insensitive) in suggestion mode', async () => {
      const results = await service.getSuggestedHotels('  gAlLe  ');
      expect(results.length).toBe(1);
      expect(results[0].destination).toBe('Galle');
    });

    it('sorts ascending for LOW budget', async () => {
      const results = await service.getSuggestedHotels('', 'Low');
      expect(results[0].price).toBeLessThanOrEqual(results[1].price);
    });
  });

  describe('bookHotel', () => {
    it('creates a valid booking with a ref code', async () => {
      const booking = await service.bookHotel('user-123', {
        hotelId: 'h1',
        roomType: 'Garden Wing Room',
        checkIn: '2026-06-01',
        checkOut: '2026-06-04',
        guests: ['John Doe', 'Jane Doe'],
      });

      expect(booking.id).toMatch(/^RC-HOTEL-[A-Z0-9]{4}-\d{3}$/);
      expect(booking.hotelName).toBe('Amangalla Heritage Resort');
      expect(booking.roomType).toBe('Garden Wing Room');
      expect(booking.totalPrice).toBe(18500 * 3); // 3 nights
      expect(booking.status).toBe('Confirmed');
    });

    it('throws NotFoundException for an invalid hotelId', async () => {
      await expect(
        service.bookHotel('user-123', {
          hotelId: 'invalid-hotel',
          roomType: 'Room',
          checkIn: '2026-06-01',
          checkOut: '2026-06-02',
          guests: ['John'],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBookings', () => {
    it('returns bookings only for the requested user', async () => {
      await service.bookHotel('user-A', {
        hotelId: 'h1',
        roomType: 'Garden Wing Room',
        checkIn: '2026-06-01',
        checkOut: '2026-06-02',
        guests: ['John'],
      });
      await service.bookHotel('user-B', {
        hotelId: 'h2',
        roomType: 'Standard Tea Chalet',
        checkIn: '2026-06-01',
        checkOut: '2026-06-02',
        guests: ['Alice'],
      });

      expect(service.getBookings('user-A').length).toBe(1);
      expect(service.getBookings('user-A')[0].userId).toBe('user-A');
      expect(service.getBookings('user-B').length).toBe(1);
    });
  });
});
