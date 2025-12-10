import { Test, TestingModule } from '@nestjs/testing';
import { TransportGateway } from './transport.gateway';
import {
  PassengerRequestDto,
  DriverAcceptDto,
  RideCancelDto,
} from './dto/transport-events.dto';

describe('TransportGateway', () => {
  let gateway: TransportGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransportGateway],
    }).compile();

    gateway = module.get<TransportGateway>(TransportGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should handle passenger_request', () => {
    const payload: PassengerRequestDto = {
      origin: 'A',
      destination: 'B',
      timestamp: '2023-01-01T00:00:00Z',
    };
    const response = gateway.handlePassengerRequest(payload);
    expect(response.event).toBe('passenger_request_ack');
    expect(response.data.status).toBe('received');
    expect(response.data.timestamp).toBeDefined();
  });

  it('should handle driver_accept', () => {
    const payload: DriverAcceptDto = {
      rideId: '123',
      driverId: '456',
    };
    const response = gateway.handleDriverAccept(payload);
    expect(response.event).toBe('driver_accept_ack');
    expect(response.data.status).toBe('accepted');
    expect(response.data.rideId).toBe('123');
  });

  it('should handle ride_cancel', () => {
    const payload: RideCancelDto = {
      rideId: '123',
      reason: 'driver cancel',
    };
    const response = gateway.handleRideCancel(payload);
    expect(response.event).toBe('ride_cancel_ack');
    expect(response.data.status).toBe('cancelled');
    expect(response.data.rideId).toBe('123');
  });
});
