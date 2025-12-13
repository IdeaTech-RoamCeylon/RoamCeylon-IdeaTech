import { IsOptional, IsString, IsIn } from 'class-validator';

export class GetProductsDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  @IsIn(['price', 'name'])
  sortBy?: string;
}
