import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class ReserveSeatDto {
  @IsString()
  @IsNotEmpty()
  seat_id: string;

  @IsEmail()
  @IsNotEmpty()
  customer_email: string;

  @IsNumber()
  @IsOptional()
  duration_minutes?: number;
}
