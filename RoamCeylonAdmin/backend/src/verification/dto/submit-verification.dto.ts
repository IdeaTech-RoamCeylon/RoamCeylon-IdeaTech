import { IsString, IsNotEmpty } from 'class-validator';

export class SubmitVerificationDto {
  @IsString()
  @IsNotEmpty()
  nicUrl: string;

  @IsString()
  @IsNotEmpty()
  businessLicenseUrl: string;

  @IsString()
  @IsNotEmpty()
  selfieUrl: string;
}
