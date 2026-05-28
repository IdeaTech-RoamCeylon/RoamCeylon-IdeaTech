import { Injectable, NotFoundException } from '@nestjs/common';

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
  price: number; // base price
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

@Injectable()
export class HotelService {
  // Stateful active bookings array for simulated persistence
  private bookings: HotelBooking[] = [];

  // Database of premium Sri Lankan stays
  private readonly hotels: Hotel[] = [
    {
      id: 'h1',
      name: 'Amangalla Heritage Resort',
      destination: 'Galle',
      rating: 4.9,
      price: 18500,
      description:
        'Set within the historic 17th-century Galle Fort, Amangalla offers an elegant, ultra-luxury step back in time with vintage decor, butler service, and an organic thermal spa.',
      image:
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80',
      amenities: [
        'Spa',
        'Pool',
        'Free Wi-Fi',
        '24h Butler',
        'Heritage Library',
        'Fine Dining',
      ],
      rooms: [
        { type: 'Garden Wing Room', price: 18500, capacity: '2 Adults' },
        {
          type: 'Fort Heritage Suite',
          price: 28000,
          capacity: '2 Adults, 1 Child',
        },
        {
          type: 'Amangalla Grand Residence',
          price: 42000,
          capacity: '4 Adults',
        },
      ],
    },
    {
      id: 'h2',
      name: 'The Lighthouse Villa',
      destination: 'Galle',
      rating: 4.7,
      price: 12500,
      description:
        'A masterpiece of tropical modernism designed by Geoffrey Bawa. Nestled on a rocky headland overlooking the Indian Ocean, offering unparalleled coastal beauty and direct beach access.',
      image:
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
      amenities: [
        'Ocean View',
        'Pool',
        'Free Wi-Fi',
        'Fitness Center',
        'Private Beach Access',
      ],
      rooms: [
        { type: 'Ocean View Deluxe', price: 12500, capacity: '2 Adults' },
        {
          type: 'Superior Spa Suite',
          price: 19000,
          capacity: '2 Adults, 1 Child',
        },
      ],
    },
    {
      id: 'h3',
      name: '98 Acres Resort & Spa',
      destination: 'Ella',
      rating: 4.9,
      price: 16000,
      description:
        'A scenic boutique hotel set on a scenic 98-acre tea estate in Ella. Experience panoramic mountain vistas, exquisite wooden chalet designs, and high-altitude luxury.',
      image:
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&auto=format&fit=crop&q=80',
      amenities: [
        'Mountain Views',
        'Infinity Pool',
        'Eco Spa',
        'Helipad',
        'Tea Tasting',
        'Free Wi-Fi',
      ],
      rooms: [
        { type: 'Standard Tea Chalet', price: 16000, capacity: '2 Adults' },
        {
          type: 'Deluxe Alpine Chalet',
          price: 24000,
          capacity: '2 Adults, 1 Child',
        },
        { type: 'Grand Royal Suite', price: 35000, capacity: '4 Adults' },
      ],
    },
    {
      id: 'h4',
      name: 'Ella Mount Heaven Resort',
      destination: 'Ella',
      rating: 4.6,
      price: 9000,
      description:
        'Perched on the ridge line of Ella Gap, this hotel features stunning balcony views directly facing the misty mountains and waterfalls. Ideal for nature and trekking lovers.',
      image:
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format&fit=crop&q=80',
      amenities: [
        'Mountain Views',
        'Balcony',
        'Pool',
        'Free Wi-Fi',
        'Restaurant',
      ],
      rooms: [
        { type: 'Deluxe Double', price: 9000, capacity: '2 Adults' },
        {
          type: 'Family Balcony Suite',
          price: 14000,
          capacity: '3 Adults, 1 Child',
        },
      ],
    },
    {
      id: 'h5',
      name: 'The Golden Crown Resort',
      destination: 'Kandy',
      rating: 4.8,
      price: 11000,
      description:
        'A lavish 5-star haven set amidst the lush paddy fields of Ampitiya, Kandy. Features exquisite Kandyan royal architecture, grand chandeliers, and premium spa facilities.',
      image:
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&auto=format&fit=crop&q=80',
      amenities: [
        'Pool',
        'Spa',
        'Free Wi-Fi',
        'Kandyan Tea House',
        'Gym',
        'Sky Lounge',
      ],
      rooms: [
        { type: 'Deluxe Crown Room', price: 11000, capacity: '2 Adults' },
        { type: 'Royal Suite', price: 21000, capacity: '2 Adults, 1 Child' },
        { type: 'Presidential Penthouse', price: 38000, capacity: '4 Adults' },
      ],
    },
    {
      id: 'h6',
      name: 'Kandy Grand Pavilions',
      destination: 'Kandy',
      rating: 4.5,
      price: 8500,
      description:
        'A cozy boutique hotel combining classic colonial aesthetics with modern comfort. Tucked away in a tranquil forested enclave overlooking Kandy town.',
      image:
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&auto=format&fit=crop&q=80',
      amenities: ['Garden Pool', 'Free Wi-Fi', 'Breakfast', 'Airport Shuttle'],
      rooms: [
        { type: 'Superior Double Room', price: 8500, capacity: '2 Adults' },
        {
          type: 'Executive Suite',
          price: 13500,
          capacity: '2 Adults, 1 Child',
        },
      ],
    },
    {
      id: 'h7',
      name: 'The Kingsbury Luxury Hotel',
      destination: 'Colombo',
      rating: 4.8,
      price: 13000,
      description:
        "Rising elegantly above the ocean and Colombo Financial District, The Kingsbury is Colombo's flagship premium stay, offering oceanfront dining, a pool, and vibrant harbor views.",
      image:
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80',
      amenities: [
        'Ocean View',
        'Pool',
        'Free Wi-Fi',
        '24h Room Service',
        'Gym',
        'Oceanfront Dining',
      ],
      rooms: [
        { type: 'Superior Ocean View', price: 13000, capacity: '2 Adults' },
        {
          type: 'Executive Club Suite',
          price: 22000,
          capacity: '2 Adults, 1 Child',
        },
      ],
    },
    {
      id: 'h8',
      name: 'Aliya Resort & Spa',
      destination: 'Sigiriya',
      rating: 4.7,
      price: 10500,
      description:
        'Inspired by the majestic Sri Lankan elephant (Aliya), this premium eco-resort faces the towering Sigiriya Rock Fortress. Swim in the infinity pool while gazing at Sigiriya.',
      image:
        'https://images.unsplash.com/photo-1529290130-4ca3753253ae?w=600&auto=format&fit=crop&q=80',
      amenities: [
        'Sigiriya Rock View',
        'Infinity Pool',
        'Ayurveda Spa',
        'Free Wi-Fi',
        'Badminton Court',
      ],
      rooms: [
        { type: 'Deluxe Triple Chalet', price: 10500, capacity: '3 Adults' },
        {
          type: 'Wooden Attic Room',
          price: 14000,
          capacity: '2 Adults, 2 Children',
        },
        { type: 'Luxury Suite with Pool', price: 25000, capacity: '4 Adults' },
      ],
    },
    {
      id: 'h9',
      name: 'Taj Bentota Resort & Spa',
      destination: 'Bentota',
      rating: 4.9,
      price: 15500,
      description:
        "A spectacular beachfront retreat on Sri Lanka's legendary south-west coast. Revel in golden sand dunes, swaying palms, Ayurveda spa therapies, and fresh ocean delicacies.",
      image:
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&auto=format&fit=crop&q=80',
      amenities: [
        'Beachfront',
        'Ayurveda Spa',
        'Pool',
        'Free Wi-Fi',
        'Water Sports Club',
        'Sea Lounge',
      ],
      rooms: [
        {
          type: 'Superior Charm Garden View',
          price: 15500,
          capacity: '2 Adults',
        },
        {
          type: 'Deluxe Delight Ocean View',
          price: 21500,
          capacity: '2 Adults, 1 Child',
        },
        { type: 'Luxury Nirvana Suite', price: 32000, capacity: '2 Adults' },
      ],
    },
  ];

  /**
   * Suggests premium hotels matching a destination
   */
  getSuggestedHotels(destination: string, budget?: string): Hotel[] {
    const destClean = (destination || '').toLowerCase().trim();

    // Filter hotels by checking if hotel destination is a substring or visa-versa
    let results = this.hotels.filter(
      (h) =>
        h.destination.toLowerCase().includes(destClean) ||
        destClean.includes(h.destination.toLowerCase()),
    );

    // Fallback: If no direct match is found, use all hotels as candidates
    if (results.length === 0) {
      results = [...this.hotels];
    }

    // Filter or sort results based on price if budget is specified
    if (budget) {
      const budgetLower = budget.toLowerCase();
      if (budgetLower === 'low' || budgetLower === 'medium') {
        // Sort lowest price first
        results.sort((a, b) => a.price - b.price);
      } else if (budgetLower === 'luxury' || budgetLower === 'high') {
        // Sort highest price first
        results.sort((a, b) => b.price - a.price);
      }
    }

    // Always return top 3
    return results.slice(0, 3);
  }

  /**
   * Process a hotel reservation in-memory
   */
  bookHotel(
    userId: string,
    bookingData: {
      hotelId: string;
      roomType: string;
      checkIn: string;
      checkOut: string;
      guests: string[];
    },
  ): HotelBooking {
    const hotel = this.hotels.find((h) => h.id === bookingData.hotelId);
    if (!hotel) {
      throw new NotFoundException(
        `Hotel with ID ${bookingData.hotelId} not found`,
      );
    }

    const room =
      hotel.rooms.find((r) => r.type === bookingData.roomType) ||
      hotel.rooms[0];

    // Calculate total price based on date difference
    const start = new Date(bookingData.checkIn);
    const end = new Date(bookingData.checkOut);
    const timeDiff = end.getTime() - start.getTime();
    const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

    const totalPrice = room.price * nights;

    const refCode = `RC-HOTEL-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

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

  /**
   * Retrieve active hotel bookings for a user
   */
  getBookings(userId: string): HotelBooking[] {
    return this.bookings.filter((b) => b.userId === userId);
  }
}
