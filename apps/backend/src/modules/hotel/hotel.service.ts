import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RoomType {
  type: string;
  price: number;
  capacity: string;
}

export interface Hotel {
  id: string;
  name: string;
  destination: string;
  rating: number;
  price: number; // base (lowest room) price
  description: string;
  image: string;
  amenities: string[];
  rooms: RoomType[];
}

export interface HotelBooking {
  id: string;
  userId: string;
  hotelId: string;
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guests: string[];
  totalPrice: number;
  status: 'Confirmed' | 'Cancelled';
  createdAt: Date;
}

// Shown when an admin hotel/room has no uploaded image yet.
const FALLBACK_HOTEL_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80';
const DEFAULT_RATING = 4.5;

// Prisma row shapes we rely on (rooms included).
type RoomRow = {
  id: string;
  name: string;
  roomType: string;
  adults: number;
  nightlyRate: unknown;
  status: string;
};
type HotelRow = {
  id: string;
  name: string;
  category: string;
  description: string;
  streetAddress: string;
  amenities: unknown;
  coverImageUrl: string;
  galleryUrls: unknown;
  rooms?: RoomRow[];
};

@Injectable()
export class HotelService {
  private readonly logger = new Logger(HotelService.name);

  // Bookings are still in-memory for now (the persistent booking system will
  // come later); only hotel/room browsing is DB-backed.
  private bookings: HotelBooking[] = [];

  constructor(private readonly prisma: PrismaService) {}

  // ── Mapping: DB rows → the shape the consumer app expects ─────────────────

  private toNumber(value: unknown): number {
    const n = typeof value === 'string' ? parseFloat(value) : Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private mapRoom = (room: RoomRow): RoomType => ({
    type: room.name || room.roomType || 'Room',
    price: this.toNumber(room.nightlyRate),
    capacity: `${room.adults || 2} Adults`,
  });

  private mapHotel = (hotel: HotelRow): Hotel => {
    const rooms = (hotel.rooms ?? []).map(this.mapRoom);
    const lowestPrice = rooms.length
      ? Math.min(...rooms.map((r) => r.price))
      : 0;
    const gallery = Array.isArray(hotel.galleryUrls)
      ? (hotel.galleryUrls as string[])
      : [];
    return {
      id: hotel.id,
      name: hotel.name,
      destination: hotel.streetAddress || hotel.category || 'Sri Lanka',
      rating: DEFAULT_RATING,
      price: lowestPrice,
      description: hotel.description || '',
      image: hotel.coverImageUrl || gallery[0] || FALLBACK_HOTEL_IMAGE,
      amenities: Array.isArray(hotel.amenities)
        ? (hotel.amenities as string[])
        : [],
      rooms,
    };
  };

  // ── Suggest / browse hotels ───────────────────────────────────────────────

  /**
   * Returns hotels created in the admin app. With an empty destination this
   * returns every active hotel (used by the consumer "hotels" browse page);
   * with a destination it filters and returns the top matches (suggestion mode
   * used by the trip planner).
   */
  async getSuggestedHotels(
    destination?: string,
    budget?: string,
  ): Promise<Hotel[]> {
    const hotels = (await this.prisma.hotel.findMany({
      where: { status: 'active' },
      include: { rooms: true },
      orderBy: { createdAt: 'desc' },
    })) as unknown as HotelRow[];

    let results = hotels.map(this.mapHotel);

    const destClean = (destination || '').toLowerCase().trim();
    const isSuggestionMode = destClean.length > 0;

    if (isSuggestionMode) {
      const filtered = results.filter(
        (h) =>
          h.destination.toLowerCase().includes(destClean) ||
          destClean.includes(h.destination.toLowerCase()) ||
          h.name.toLowerCase().includes(destClean),
      );
      results = filtered.length > 0 ? filtered : results;
    }

    if (budget) {
      const b = budget.toLowerCase();
      if (b === 'low' || b === 'medium') {
        results.sort((a, b2) => a.price - b2.price);
      } else if (b === 'luxury' || b === 'high') {
        results.sort((a, b2) => b2.price - a.price);
      }
    }

    // Suggestion mode returns the top 3; browse mode returns all hotels.
    return isSuggestionMode ? results.slice(0, 3) : results;
  }

  // ── Booking (in-memory, temporary) ────────────────────────────────────────

  async bookHotel(
    userId: string,
    bookingData: {
      hotelId: string;
      roomType: string;
      checkIn: string;
      checkOut: string;
      guests: string[];
    },
  ): Promise<HotelBooking> {
    const hotelRow = (await this.prisma.hotel.findUnique({
      where: { id: bookingData.hotelId },
      include: { rooms: true },
    })) as unknown as HotelRow | null;

    if (!hotelRow) {
      throw new NotFoundException(
        `Hotel with ID ${bookingData.hotelId} not found`,
      );
    }

    const hotel = this.mapHotel(hotelRow);
    const room = hotel.rooms.find((r) => r.type === bookingData.roomType) ??
      hotel.rooms[0] ?? { type: 'Room', price: hotel.price, capacity: '' };

    const start = new Date(bookingData.checkIn);
    const end = new Date(bookingData.checkOut);
    const nights = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)),
    );
    const totalPrice = room.price * nights;

    const refCode = `RC-HOTEL-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newBooking: HotelBooking = {
      id: refCode,
      userId,
      hotelId: hotel.id,
      hotelName: hotel.name,
      roomType: room.type,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      guests: bookingData.guests || ['Main Guest'],
      totalPrice,
      status: 'Confirmed',
      createdAt: new Date(),
    };

    this.bookings.push(newBooking);
    return newBooking;
  }

  getBookings(userId: string): HotelBooking[] {
    return this.bookings.filter((b) => b.userId === userId);
  }
}
