import { Test, TestingModule } from '@nestjs/testing';
import { HotelService } from './hotel.service';
import { NotFoundException } from '@nestjs/common';

describe('HotelService', () => {
  let service: HotelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HotelService],
    }).compile();

    service = module.get<HotelService>(HotelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSuggestedHotels', () => {
    it('should return matching hotels for a valid destination', () => {
      const results = service.getSuggestedHotels('Galle');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].destination).toBe('Galle');
    });

    it('should handle case insensitivity and partial matches', () => {
      const results = service.getSuggestedHotels('  gAlLe  ');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].destination).toBe('Galle');
    });

    it('should return default hotels as fallback for an unknown destination', () => {
      const results = service.getSuggestedHotels('NonExistentPlace');
      expect(results.length).toBe(3); // fallback returns top 3
    });

    it('should sort by price ascending for LOW budget', () => {
      const results = service.getSuggestedHotels('Ella', 'Low');
      expect(results.length).toBe(2);
      expect(results[0].price).toBeLessThan(results[1].price);
    });

    it('should sort by price descending for HIGH budget', () => {
      const results = service.getSuggestedHotels('Ella', 'High');
      expect(results.length).toBe(2);
      expect(results[0].price).toBeGreaterThan(results[1].price);
    });
  });

  describe('bookHotel', () => {
    it('should create a valid booking and generate ref code', () => {
      const booking = service.bookHotel('user-123', {
        hotelId: 'h1',
        roomType: 'Garden Wing Room',
        checkIn: '2026-06-01',
        checkOut: '2026-06-04',
        guests: ['John Doe', 'Jane Doe'],
      });

      expect(booking).toBeDefined();
      expect(booking.id).toMatch(/^RC-HOTEL-[A-Z0-9]{4}-\d{3}$/);
      expect(booking.hotelName).toBe('Amangalla Heritage Resort');
      expect(booking.roomType).toBe('Garden Wing Room');
      expect(booking.guests.length).toBe(2);
      expect(booking.totalPrice).toBe(18500 * 3); // 3 nights
      expect(booking.status).toBe('Confirmed');
    });

    it('should throw NotFoundException for invalid hotelId', () => {
      expect(() => {
        service.bookHotel('user-123', {
          hotelId: 'invalid-hotel',
          roomType: 'Room',
          checkIn: '2026-06-01',
          checkOut: '2026-06-02',
          guests: ['John'],
        });
      }).toThrow(NotFoundException);
    });
  });

  describe('getBookings', () => {
    it('should return bookings only for the requested user', () => {
      service.bookHotel('user-A', {
        hotelId: 'h1',
        roomType: 'Garden Wing Room',
        checkIn: '2026-06-01',
        checkOut: '2026-06-02',
        guests: ['John'],
      });

      service.bookHotel('user-B', {
        hotelId: 'h3',
        roomType: 'Standard Tea Chalet',
        checkIn: '2026-06-01',
        checkOut: '2026-06-02',
        guests: ['Alice'],
      });

      const bookingsA = service.getBookings('user-A');
      expect(bookingsA.length).toBe(1);
      expect(bookingsA[0].userId).toBe('user-A');

      const bookingsB = service.getBookings('user-B');
      expect(bookingsB.length).toBe(1);
      expect(bookingsB[0].userId).toBe('user-B');
    });
  });
});
