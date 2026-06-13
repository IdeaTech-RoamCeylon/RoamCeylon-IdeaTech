export type PackageStatus = 'active' | 'draft' | 'inactive';
export type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';
export type InquiryStatus = 'new' | 'priority' | 'responded' | 'archived';
export type NotificationType = 'booking' | 'chat' | 'payment' | 'system';

export interface TourPackage {
  id: string;
  guideId: string;
  name: string;
  category: string;
  description: string;
  coverImageUrl: string;
  duration: number;
  price: number;
  highlights: string[];
  location: string;
  status: PackageStatus;
  publishImmediately: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TourBooking {
  id: string;
  packageId: string;
  guideId: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerAvatar: string;
  tourName: string;
  startDate: Date;
  endDate: Date;
  guests: number;
  amount: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TourInquiry {
  id: string;
  guideId: string;
  guestName: string;
  guestEmail: string;
  guestAvatar: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  tourInterest: string;
  pipelineValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TourNotification {
  id: string;
  guideId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string;
  createdAt: Date;
}
