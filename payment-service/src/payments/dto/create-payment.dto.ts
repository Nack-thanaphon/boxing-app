import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { PaymentMethod } from '../../database/entities/payment.entity';

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  payment_method: PaymentMethod;

  @IsString()
  @IsOptional()
  seat_id?: string;

  @IsEmail()
  @IsOptional()
  customer_email?: string;

  @IsString()
  @IsOptional()
  token?: string;

  // Card details for backend tokenization
  @IsString()
  @IsOptional()
  card_number?: string;

  @IsString()
  @IsOptional()
  card_name?: string;

  @IsString()
  @IsOptional()
  expiration_month?: string;

  @IsString()
  @IsOptional()
  expiration_year?: string;

  @IsString()
  @IsOptional()
  security_code?: string;
}
