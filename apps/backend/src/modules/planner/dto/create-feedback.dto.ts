// apps\backend\src\modules\planner\dto\create-feedback.dto.ts
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Sanitizes text input by trimming whitespace and removing potential XSS characters
 */
function SanitizeText() {
  return Transform(({ value }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (typeof value !== 'string') return value;
    // Trim whitespace
    let sanitized = value.trim();
    // Remove potential XSS patterns (basic sanitization)
    // More robust sanitization should use a library like DOMPurify on frontend
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      '',
    );
    sanitized = sanitized.replace(
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      '',
    );
    return sanitized;
  });
}

/**
 * DTO for feedback value structure (FUTURE EXTENSION)
 *
 * Will support:
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
  categories?: Record<string, number>;
}

/**
 * DTO for creating trip feedback
 * Currently supports only rating (1-5)
 */
export class CreateFeedbackDto {
  @IsNotEmpty({ message: 'Trip ID is required' })
  @IsString({ message: 'Trip ID must be a string' })
  tripId: string;

  @IsNotEmpty({ message: 'Rating is required' })
  @IsNumber({}, { message: 'Rating must be a number' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must be at most 5' })
  feedbackRating: number;
}
