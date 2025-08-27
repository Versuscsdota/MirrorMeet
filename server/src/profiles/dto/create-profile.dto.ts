import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}
