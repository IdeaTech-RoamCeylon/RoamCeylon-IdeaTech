export interface Driver {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
}

export interface RideRequest {
  id: string;
  passenger: string;
  from: string;
  to: string;
  status: string;
}
