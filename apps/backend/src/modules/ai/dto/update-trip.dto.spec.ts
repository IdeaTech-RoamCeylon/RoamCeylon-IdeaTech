import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateTripRequestDto } from './update-trip.dto';

describe('UpdateTripRequestDto', () => {
  
  // TEST 1: Everything is correct
  it('should validate a correct DTO object', async () => {
    // 1. Create the plain JSON data (simulating frontend input)
    const rawData = {
      tripId: 'trip-123',
      change: {
        type: 'REORDER',
        value: 1,
        reason: 'User preference'
      },
      currentPlan: [
        { placeId: 'p1', order: 1, timeSlot: 'Morning' }
      ]
    };

    // 2. Convert Plain JSON -> Class Instance (The "Magic" Step)
    // This attaches the @IsString rules to the data so validator can see them
    const dto = plainToInstance(UpdateTripRequestDto, rawData);

    // 3. Validate
    const errors = await validate(dto);
    expect(errors.length).toBe(0); // Now it will pass with 0 errors!
  });

  // TEST 2: Missing the required tripId
  it('should fail if tripId is missing', async () => {
    const rawData = {
      // tripId is missing
      change: { type: 'DELAY' },
      currentPlan: []
    };
    
    const dto = plainToInstance(UpdateTripRequestDto, rawData);
    const errors = await validate(dto);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('tripId');
  });

  // TEST 3: Invalid Change Type
  it('should fail if change type is invalid', async () => {
    const rawData = {
      tripId: 'trip-123',
      change: { 
        type: 'INVALID_TYPE' // Bad data
      },
      currentPlan: []
    };

    const dto = plainToInstance(UpdateTripRequestDto, rawData);
    const errors = await validate(dto);
    
    expect(errors.length).toBeGreaterThan(0); 
  });
});