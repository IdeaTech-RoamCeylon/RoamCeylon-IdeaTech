import { Injectable } from '@nestjs/common';

import { Driver, RideRequest } from './item.interface';

@Injectable()
export class TransportService {
  private drivers: Driver[] = [];
  private rideRequests: RideRequest[] = [];

  seedDrivers() {
    this.drivers = [
      {
        id: 'd1',
        name: 'Kamal Perera',
        lat: 6.9271,
        lng: 79.8612,
        status: 'available',
      }, // Colombo
      {
        id: 'd2',
        name: 'Nimal Silva',
        lat: 6.9319,
        lng: 79.8475,
        status: 'busy',
      }, // Pettah
      {
        id: 'd3',
        name: 'Sunil Cooray',
        lat: 6.9023,
        lng: 79.8596,
        status: 'available',
      }, // Bambalapitiya
    ];
    return { message: 'Drivers seeded', count: this.drivers.length };
  }

  seedRideRequests() {
    this.rideRequests = [
      {
        id: 'r1',
        passenger: 'Guest',
        from: 'Fort',
        to: 'Mount Lavinia',
        status: 'pending',
      },
      {
        id: 'r2',
        passenger: 'Sayura',
        from: 'Kollupitiya',
        to: 'Nugegoda',
        status: 'completed',
      },
    ];
    return { message: 'Ride requests seeded', count: this.rideRequests.length };
  }

  getDrivers(): Driver[] {
    return this.drivers;
  }

  getRideRequests(): RideRequest[] {
    return this.rideRequests;
  }
}
