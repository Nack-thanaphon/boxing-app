import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CancelReservationDto {
  @IsString()
  @IsNotEmpty()
  seat_id: string;

  @IsEmail()
  @IsNotEmpty()
  customer_email: string;
}
