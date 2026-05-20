// apps/backend/src/modules/ml/dto/get-recommendations.dto.ts

import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GetRecommendationsDto {
  /**
   * The user ID for whom personalized recommendations are generated.
   * If omitted, falls back to 'admin' (development default).
   */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  userId?: string;
}
