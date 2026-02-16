import {
    IsNotEmpty,
    IsInt,
    IsPositive,
    IsObject,
    IsOptional,
    IsNumber,
    Min,
    Max,
    IsString,
    MaxLength,
    ValidateNested,
    Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Sanitizes text input by trimming whitespace and removing potential XSS characters
 */
function SanitizeText() {
    return Transform(({ value }) => {
        if (typeof value !== 'string') return value;
        // Trim whitespace
        let sanitized = value.trim();
        // Remove potential XSS patterns (basic sanitization)
        // More robust sanitization should use a library like DOMPurify on frontend
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
        return sanitized;
    });
}

/**
 * DTO for feedback value structure
 * Supports flexible feedback formats:
 * - Numeric rating (1-5)
 * - Optional text comment (sanitized)
 * - Optional category-based feedback
 */
export class FeedbackValueDto {
    @IsOptional()
    @IsNumber()
    @Min(1, { message: 'Rating must be at least 1' })
    @Max(5, { message: 'Rating must be at most 5' })
    rating?: number;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Comment must be less than 500 characters' })
    @SanitizeText()
    @Matches(/^[^<>]*$/, {
        message: 'Comment contains invalid characters',
    })
    comment?: string;

    @IsOptional()
    @IsObject()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories?: Record<string, any>;
}

/**
 * DTO for creating trip feedback
 */
export class CreateFeedbackDto {
    @IsNotEmpty({ message: 'Trip ID is required' })
    @IsInt({ message: 'Trip ID must be an integer' })
    @IsPositive({ message: 'Trip ID must be a positive number' })
    tripId: number;

    @IsNotEmpty({ message: 'Feedback value is required' })
    @IsObject({ message: 'Feedback value must be a valid object' })
    @ValidateNested()
    @Type(() => FeedbackValueDto)
    feedbackValue: FeedbackValueDto;
}
