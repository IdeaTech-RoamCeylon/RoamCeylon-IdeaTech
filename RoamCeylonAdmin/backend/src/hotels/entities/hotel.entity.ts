export type HotelStatus = 'active' | 'inactive';

export interface Hotel {
  id: string;
  ownerId: string; // Nhost user ID of the hotel partner
  name: string;
  category: string;
  description: string;
  streetAddress: string;
  latitude: number | null;
  longitude: number | null;
  amenities: string[];
  coverImageUrl: string;
  galleryUrls: string[];
  status: HotelStatus;

  createdAt: Date;
  updatedAt: Date;
}
