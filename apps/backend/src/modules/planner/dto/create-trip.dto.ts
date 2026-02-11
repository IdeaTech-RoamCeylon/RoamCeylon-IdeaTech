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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function IsBeforeEndDate(validationOptions?: ValidationOptions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function (object: any, propertyName: string) {
        registerDecorator({
            name: 'isBeforeEndDate',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                validate(value: any, args: ValidationArguments) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const obj = args.object as any;
                    if (!value || !obj.endDate) return true; // Skip if either is missing
                    return new Date(value) < new Date(obj.endDate);
                },
                defaultMessage(args: ValidationArguments) {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itinerary: any;

    @IsOptional()
    @ValidateNested()
    @Type(() => TripPreferencesDto)
    preferences?: TripPreferencesDto;
}
