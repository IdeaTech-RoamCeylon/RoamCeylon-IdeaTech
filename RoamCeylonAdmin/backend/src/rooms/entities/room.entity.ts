export type RoomStatus = 'available' | 'booked' | 'maintenance';

export interface Room {
  id: string;
  ownerId: string; // Nhost user ID of the hotel partner
  hotelId: string | null;
  name: string;
  roomType: string;
  squareFootage: number;
  adults: number;
  availableUnits: number;
  nightlyRate: number;
  amenities: string[];
  coverImageUrl: string;
  galleryUrls: string[];
  status: RoomStatus;

  createdAt: Date;
  updatedAt: Date;
}
