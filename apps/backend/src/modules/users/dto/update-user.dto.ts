import {
  IsEmail,
  IsOptional,
  IsString,
  IsDateString,
  IsIn,
  MaxLength,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

// Custom validator to ensure birthday is in the past and reasonable
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function IsValidBirthday(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidBirthday',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validate(value: any) {
          if (!value) return true; // Optional field
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const birthday = new Date(value);
          const today = new Date();
          const minDate = new Date();
          minDate.setFullYear(today.getFullYear() - 120); // Max age 120 years

          // Birthday must be in the past and within reasonable range
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          return birthday < today && birthday > minDate;
        },
        defaultMessage() {
          return 'Birthday must be a valid date in the past (within the last 120 years)';
        },
      },
    });
  };
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Name must be less than 100 characters' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255, { message: 'Email must be less than 255 characters' })
  email?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Birthday must be a valid ISO 8601 date' })
  @IsValidBirthday()
  birthday?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Male', 'Female', 'Other'], {
    message: 'Gender must be one of: Male, Female, Other',
  })
  gender?: string;
}
