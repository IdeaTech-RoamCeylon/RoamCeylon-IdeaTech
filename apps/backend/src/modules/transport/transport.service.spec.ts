import { Test, TestingModule } from '@nestjs/testing';
import { TransportService } from './transport.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';

describe('TransportService', () => {
    let service: TransportService;
    let prisma: PrismaService;

    const mockDrivers = [
        { driverId: 'driver-1', lat: 6.9271, lng: 79.8612, distance: 100 },
        { driverId: 'driver-2', lat: 6.9300, lng: 79.8650, distance: 500 },
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransportService,
                {
                    provide: PrismaService,
                    useValue: {
                        $queryRaw: jest.fn(),
                        rideRequest: {
                            updateMany: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<TransportService>(TransportService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findNearbyDrivers', () => {
        it('should return a list of drivers sorted by distance', async () => {
            (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockDrivers);

            const result = await service.findNearbyDrivers(6.9271, 79.8612, 5000);

            expect(result).toHaveLength(2);
            expect(result[0].driverId).toBe('driver-1');
            expect(prisma.$queryRaw).toHaveBeenCalled();
        });

        it('should handle no-driver scenarios gracefully', async () => {
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

            const result = await service.findNearbyDrivers(6.9271, 79.8612, 5000);

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });
    });

    describe('acceptRide', () => {
        it('should successfully accept a ride if status is PENDING', async () => {
            (prisma.rideRequest.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

            const result = await service.acceptRide(1, 'driver-1');

            expect(result).toEqual({ success: true });
            expect(prisma.rideRequest.updateMany).toHaveBeenCalledWith({
                where: { id: 1, status: 'PENDING' },
                data: { status: 'ACCEPTED', driverId: 'driver-1' },
            });
        });

        it('should throw an error if the ride is already taken or not found', async () => {
            (prisma.rideRequest.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

            await expect(service.acceptRide(1, 'driver-1')).rejects.toThrow(
                'Ride already accepted or not found',
            );
        });
    });
});
