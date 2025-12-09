import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  PassengerRequestDto,
  DriverAcceptDto,
  RideCancelDto,
} from './dto/transport-events.dto';

@WebSocketGateway({
  namespace: 'socket/rides',
  cors: {
    origin: '*',
  },
})
export class TransportGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TransportGateway.name);

  @SubscribeMessage('passenger_request')
  handlePassengerRequest(@MessageBody() data: PassengerRequestDto) {
    this.logger.log(`Passenger request received: ${JSON.stringify(data)}`);
    return {
      event: 'passenger_request_ack',
      data: { status: 'received', timestamp: new Date().toISOString() },
    };
  }

  @SubscribeMessage('driver_accept')
  handleDriverAccept(@MessageBody() data: DriverAcceptDto) {
    this.logger.log(`Driver accepted ride: ${JSON.stringify(data)}`);
    return {
      event: 'driver_accept_ack',
      data: { status: 'accepted', rideId: data.rideId },
    };
  }

  @SubscribeMessage('ride_cancel')
  handleRideCancel(@MessageBody() data: RideCancelDto) {
    this.logger.log(`Ride cancelled: ${JSON.stringify(data)}`);
    return {
      event: 'ride_cancel_ack',
      data: { status: 'cancelled', rideId: data.rideId },
    };
  }
}
