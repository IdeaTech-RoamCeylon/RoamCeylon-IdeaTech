import apiService from './api';

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
  price: number;
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
  createdAt: string;
}

class HotelService {
  /**
   * Fetch hotel suggestions for a destination and budget
   */
  async getSuggestions(destination: string, budget?: string): Promise<Hotel[]> {
    try {
      const budgetParam = budget ? `&budget=${encodeURIComponent(budget)}` : '';
      const response = await apiService.get<Hotel[]>(
        `/hotel/suggest?destination=${encodeURIComponent(destination)}${budgetParam}`
      );
      return response || [];
    } catch (error) {
      console.error('Failed to fetch hotel suggestions:', error);
      return [];
    }
  }

  /**
   * Book a hotel room
   */
  async bookHotel(bookingData: {
    hotelId: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    guests: string[];
  }): Promise<HotelBooking> {
    try {
      const response = await apiService.post<HotelBooking>('/hotel/book', bookingData);
      return response;
    } catch (error) {
      console.error('Failed to book hotel:', error);
      throw error;
    }
  }

  /**
   * Fetch active bookings
   */
  async getBookings(): Promise<HotelBooking[]> {
    try {
      const response = await apiService.get<HotelBooking[]>('/hotel/bookings');
      return response || [];
    } catch (error) {
      console.error('Failed to fetch hotel bookings:', error);
      return [];
    }
  }
}

export const hotelService = new HotelService();
export default hotelService;
