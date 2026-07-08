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
      const response = await apiService.get<any>(
        `/hotel/suggest?destination=${encodeURIComponent(destination)}${budgetParam}`
      );
      // Backend wraps successful responses in a { data } envelope.
      const list = Array.isArray(response) ? response : response?.data;
      return Array.isArray(list) ? list : [];
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
      const response = await apiService.post<any>('/hotel/book', bookingData);
      // Unwrap the { data } envelope if present.
      return (response?.data ?? response) as HotelBooking;
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
      const response = await apiService.get<any>('/hotel/bookings');
      const list = Array.isArray(response) ? response : response?.data;
      return Array.isArray(list) ? list : [];
    } catch (error) {
      console.error('Failed to fetch hotel bookings:', error);
      return [];
    }
  }
}

export const hotelService = new HotelService();
export default hotelService;
