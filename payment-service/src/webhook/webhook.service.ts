import { Injectable } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';
import { LoggerService } from '../common/logger/logger.service';
import { PaymentStatus } from '../database/entities/payment.entity';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  constructor(
    private paymentsService: PaymentsService,
    private loggerService: LoggerService,
  ) { }

  async handleOmiseWebhook(
    body: any,
    headers: any,
    rawBody: Buffer,
  ): Promise<{ status: string }> {
    try {
      // Verify webhook signature
      const signature = headers['x-omise-signature'];
      if (signature && process.env.OMISE_WEBHOOK_SECRET) {
        const expectedSignature = crypto
          .createHmac('sha256', process.env.OMISE_WEBHOOK_SECRET)
          .update(rawBody)
          .digest('hex');

        if (signature !== expectedSignature) {
          await this.loggerService.logPayment(
            'warn',
            'Invalid webhook signature',
            { signature, expected: expectedSignature },
            null,
            null,
            'webhook_verification',
            'failed',
          );
          throw new Error('Invalid webhook signature');
        }
      }

      const { key: eventType, data } = body;
      const charge = data;

      await this.loggerService.logPayment(
        'info',
        `Webhook received: ${eventType}`,
        { event: body },
        null,
        charge.id,
        'webhook_received',
        eventType,
      );

      let newStatus: PaymentStatus;

      switch (eventType) {
        case 'charge.create': // Handle initial charge creation
          // Omise sends the current status of the charge when it's created
          switch (charge.status) {
            case 'successful':
              newStatus = PaymentStatus.PAID;
              break;
            case 'failed':
              newStatus = PaymentStatus.FAILED;
              break;
            case 'pending':
              newStatus = PaymentStatus.PENDING;
              break;
            default:
              // If we get an unexpected status on charge.create, log and ignore for now
              await this.loggerService.logPayment(
                'warn',
                `Unhandled charge.create status: ${charge.status}`,
                { event: body, chargeStatus: charge.status },
                null,
                charge.id,
                'webhook_unhandled_create_status',
                eventType,
              );
              return { status: 'ignored' };
          }
          break; // Don't forget to break after handling charge.create
        case 'charge.complete':
          newStatus = PaymentStatus.PAID;
          break;
        case 'charge.failed':
          newStatus = PaymentStatus.FAILED;
          break;
        case 'charge.pending':
          newStatus = PaymentStatus.PENDING;
          break;
        case 'charge.reversed':
          newStatus = PaymentStatus.REFUNDED;
          break;
        default:
          await this.loggerService.logPayment(
            'warn',
            `Unhandled webhook event: ${eventType}`,
            { event: body },
            null,
            charge.id,
            'webhook_unhandled',
            eventType,
          );
          return { status: 'ignored' };
      }

      // Update payment status
      const updatedPayment = await this.paymentsService.updatePaymentStatus(charge.id, newStatus);

      await this.loggerService.logPayment(
        'info',
        `Payment status updated to ${newStatus}`,
        {
          payment_id: updatedPayment.id,
          omise_charge_id: charge.id,
          previous_status: updatedPayment.status,
          new_status: newStatus
        },
        updatedPayment.id,
        charge.id,
        'webhook_status_update',
        newStatus,
      );

      return { status: 'success' };
    } catch (error) {
      await this.loggerService.logPayment(
        'error',
        'Webhook processing failed',
        { error: error.message, body },
        null,
        null,
        'webhook_error',
        'failed',
      );
      throw error;
    }
  }
}
