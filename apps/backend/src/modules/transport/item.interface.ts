export interface Driver {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
  eta?: string;
}

export enum RideStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  EN_ROUTE = 'en_route',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface RideRequest {
  id: string;
  passenger: string;
  from: string;
  to: string;
  status: RideStatus | string;
}
