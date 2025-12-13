import { IsOptional, IsString } from 'class-validator';

export class GetProductsDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;
}
