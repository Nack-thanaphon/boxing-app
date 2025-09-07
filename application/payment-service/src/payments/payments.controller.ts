import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponse } from './payments.service';
import { PaymentMethodsResponse } from './dto/payment-method.dto';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post('create')
  async createPayment(@Body() createPaymentDto: CreatePaymentDto): Promise<PaymentResponse> {
    return this.paymentsService.createPayment(createPaymentDto);
  }

  @Get('methods')
  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    return this.paymentsService.getPaymentMethods();
  }

  @Get()
  async getAllPayments() {
    return this.paymentsService.getPayments();
  }

  @Get(':id')
  async getPayment(@Param('id') id: string) {
    return this.paymentsService.getPayment(id);
  }

  @Get(':id/status')
  async getPaymentStatus(@Param('id') id: string) {
    return this.paymentsService.getPaymentStatus(id);
  }

  @Post(':id/cancel')
  async cancelPayment(@Param('id') id: string) {
    return this.paymentsService.cancelPayment(id);
  }

  @Post(':id/force-update')
  async forceUpdatePaymentStatus(@Param('id') id: string) {
    return this.paymentsService.forceUpdatePaymentStatus(id);
  }
}
