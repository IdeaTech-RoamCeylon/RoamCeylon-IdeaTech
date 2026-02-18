import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsObject,
  IsIn,
  IsArray,
  IsBoolean,
  MaxLength,
  ValidateNested,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';

// Custom validator to ensure startDate is before endDate

function IsBeforeEndDate(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isBeforeEndDate',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const obj = args.object as any;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (!value || !obj.endDate) return true; // Skip if either is missing
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          return new Date(value) < new Date(obj.endDate);
        },
        defaultMessage() {
          return 'Start date must be before end date';
        },
      },
    });
  };
}

// Preferences DTO
export class TripPreferencesDto {
  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high'], {
    message: 'Budget must be one of: low, medium, high',
  })
  budget?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, {
    each: true,
    message: 'Each interest must be less than 50 characters',
  })
  interests?: string[];

  @IsOptional()
  @IsString()
  @IsIn(['relaxed', 'moderate', 'packed'], {
    message: 'Travel style must be one of: relaxed, moderate, packed',
  })
  travelStyle?: string;

  @IsOptional()
  @IsBoolean()
  accessibility?: boolean;
}

export class CreateTripDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Trip name must be less than 100 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Destination must be less than 100 characters' })
  destination?: string;

  @IsNotEmpty({ message: 'Start date is required' })
  @IsDateString(
    {},
    { message: 'Start date must be a valid ISO 8601 date string' },
  )
  @IsBeforeEndDate()
  startDate: string;

  @IsNotEmpty({ message: 'End date is required' })
  @IsDateString(
    {},
    { message: 'End date must be a valid ISO 8601 date string' },
  )
  endDate: string;

  @IsNotEmpty({ message: 'Itinerary is required' })
  @IsObject({ message: 'Itinerary must be a valid object' })
  itinerary: any;

  @IsOptional()
  @ValidateNested()
  @Type(() => TripPreferencesDto)
  preferences?: TripPreferencesDto;
}
