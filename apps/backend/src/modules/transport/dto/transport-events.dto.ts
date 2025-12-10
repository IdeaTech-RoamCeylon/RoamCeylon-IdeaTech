export class PassengerRequestDto {
  origin: string;
  destination: string;
  timestamp: string;
}

export class DriverAcceptDto {
  rideId: string;
  driverId: string;
}

export class RideCancelDto {
  rideId: string;
  reason: string;
}
