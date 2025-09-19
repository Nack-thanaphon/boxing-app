import { Controller, Post, Body, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponse } from './payments.service';
import { PaymentMethodsResponse } from './dto/payment-method.dto';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post('create')
  async createPayment(@Body() createPaymentDto: CreatePaymentDto): Promise<PaymentResponse> {
    try {
      return await this.paymentsService.createPayment(createPaymentDto);
    } catch (error) {
      console.error('Controller error:', error);

      // Determine appropriate HTTP status code
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      if (error.code === 'SEAT_NOT_FOUND' || error.code === 'SEAT_NOT_AVAILABLE' || error.code === 'INVALID_SEAT_ID') {
        statusCode = HttpStatus.BAD_REQUEST;
      } else if (error.code === 'PAYMENT_SERVICE_UNAVAILABLE') {
        statusCode = HttpStatus.SERVICE_UNAVAILABLE;
      } else if (error.code === 'INSUFFICIENT_FUNDS' || error.code === 'CARD_DECLINED') {
        statusCode = HttpStatus.PAYMENT_REQUIRED;
      }

      throw new HttpException(
        {
          message: error.message || 'เกิดข้อผิดพลาดในการสร้างการชำระเงิน',
          code: error.code || 'PAYMENT_CREATION_FAILED',
          details: error.originalError || null,
        },
        statusCode
      );
    }
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
