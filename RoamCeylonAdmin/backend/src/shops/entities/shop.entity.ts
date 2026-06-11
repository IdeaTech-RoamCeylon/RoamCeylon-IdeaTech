export type ShopStatus = 'active' | 'under_review' | 'inactive';

export interface Shop {
  id: string;
  ownerId: string; // Nhost user ID of the shop_partner
  name: string;
  category: string;
  description: string;
  coverImageUrl: string;
  status: ShopStatus;

  // Business hours
  hoursEnabled: boolean;
  hoursText: string;

  // External integrations
  website: string;
  instagram: string;
  facebook: string;
  tiktok: string;

  // Location
  location: string;

  createdAt: Date;
  updatedAt: Date;
}
