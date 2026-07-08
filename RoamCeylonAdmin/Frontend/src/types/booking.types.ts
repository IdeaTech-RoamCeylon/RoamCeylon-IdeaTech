export type RoomStatus = 'available' | 'booked' | 'maintenance';

export interface Room {
  id: string;
  ownerId: string;
  hotelId: string | null;
  name: string;
  roomType: string;
  squareFootage: number;
  adults: number;
  availableUnits: number;
  nightlyRate: number | string;
  amenities: string[];
  coverImageUrl: string;
  galleryUrls: string[];
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
}

export type HotelStatus = 'active' | 'inactive';

export interface Hotel {
  id: string;
  ownerId: string;
  name: string;
  category: string;
  description: string;
  streetAddress: string;
  latitude: number | string | null;
  longitude: number | string | null;
  amenities: string[];
  coverImageUrl: string;
  galleryUrls: string[];
  status: HotelStatus;
  createdAt: string;
  updatedAt: string;
}
