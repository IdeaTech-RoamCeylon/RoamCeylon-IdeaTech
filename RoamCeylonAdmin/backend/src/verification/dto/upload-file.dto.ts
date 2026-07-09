import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  base64: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}
