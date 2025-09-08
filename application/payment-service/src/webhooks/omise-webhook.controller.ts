import { Controller, Post, Body, Headers, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../database/entities/payment.entity';
import { PaymentLog, LogLevel } from '../database/entities/payment-log.entity';
import { Seat, SeatStatus } from '../database/entities/seat.entity';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Controller('webhooks')
export class OmiseWebhookController {
    private readonly logger = new Logger(OmiseWebhookController.name);

    constructor(
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        @InjectRepository(PaymentLog)
        private paymentLogRepository: Repository<PaymentLog>,
        @InjectRepository(Seat)
        private seatRepository: Repository<Seat>,
        private configService: ConfigService,
    ) { }

    /**
     * Webhook endpoint สำหรับรับ callback จาก Omise
     */
    @Post('omise')
    @HttpCode(HttpStatus.OK)
    async handleOmiseWebhook(
        @Body() webhookData: any,
        @Headers('x-omise-signature') signature: string,
    ) {
        this.logger.log('🔔 Received Omise webhook');

        try {
            // 1. Verify webhook signature
            if (!this.verifyWebhookSignature(webhookData, signature)) {
                this.logger.error('❌ Invalid webhook signature');
                return { error: 'Invalid signature' };
            }

            // 2. Process webhook data
            await this.processWebhookData(webhookData);

            this.logger.log('✅ Webhook processed successfully');
            return { status: 'success' };
        } catch (error) {
            this.logger.error('❌ Webhook processing failed:', error);
            return { error: 'Processing failed' };
        }
    }

    /**
     * Verify webhook signature
     */
    private verifyWebhookSignature(webhookData: any, signature: string): boolean {
        try {
            const webhookSecret = this.configService.get<string>('OMISE_WEBHOOK_SECRET');

            if (!webhookSecret) {
                this.logger.warn('⚠️ Webhook secret not configured');
                return true; // Allow in development
            }

            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(webhookData))
                .digest('hex');

            return signature === expectedSignature;
        } catch (error) {
            this.logger.error('❌ Signature verification failed:', error);
            return false;
        }
    }

    /**
     * Process webhook data
     */
    private async processWebhookData(webhookData: any) {
        const { type, data } = webhookData;

        this.logger.log(`📋 Processing webhook type: ${type}`);

        switch (type) {
            case 'charge.complete':
                await this.handleChargeComplete(data);
                break;
            case 'charge.failed':
                await this.handleChargeFailed(data);
                break;
            case 'charge.cancel':
                await this.handleChargeCancel(data);
                break;
            default:
                this.logger.log(`ℹ️ Unhandled webhook type: ${type}`);
        }
    }

    /**
     * Handle charge complete
     */
    private async handleChargeComplete(chargeData: any) {
        this.logger.log(`✅ Charge completed: ${chargeData.id}`);

        try {
            // หา payment ใน database
            const payment = await this.paymentRepository.findOne({
                where: { omise_charge_id: chargeData.id },
                relations: ['seat'],
            });

            if (!payment) {
                this.logger.warn(`⚠️ Payment not found for charge: ${chargeData.id}`);
                return;
            }

            // อัปเดต payment status
            await this.paymentRepository.update(payment.id, {
                status: PaymentStatus.PAID,
                updated_at: new Date(),
            });

            // อัปเดต seat status
            await this.seatRepository.update(payment.seat_id, {
                status: SeatStatus.OCCUPIED,
                updated_at: new Date(),
            });

            // บันทึก log
            await this.logWebhookEvent(payment.id, 'charge_complete', 'successful', {
                omise_charge_id: chargeData.id,
                amount: chargeData.amount,
                currency: chargeData.currency,
                paid_at: chargeData.paid_at,
            });

            this.logger.log(`✅ Successfully processed charge complete: ${chargeData.id}`);
        } catch (error) {
            this.logger.error(`❌ Failed to process charge complete: ${chargeData.id}`, error);
            throw error;
        }
    }

    /**
     * Handle charge failed
     */
    private async handleChargeFailed(chargeData: any) {
        this.logger.log(`❌ Charge failed: ${chargeData.id}`);

        try {
            // หา payment ใน database
            const payment = await this.paymentRepository.findOne({
                where: { omise_charge_id: chargeData.id },
                relations: ['seat'],
            });

            if (!payment) {
                this.logger.warn(`⚠️ Payment not found for charge: ${chargeData.id}`);
                return;
            }

            // อัปเดต payment status
            await this.paymentRepository.update(payment.id, {
                status: PaymentStatus.FAILED,
                updated_at: new Date(),
            });

            // ปลดล็อก seat
            await this.seatRepository.update(payment.seat_id, {
                status: SeatStatus.AVAILABLE,
                reserved_until: null,
                reserved_by: null,
                updated_at: new Date(),
            });

            // บันทึก log
            await this.logWebhookEvent(payment.id, 'charge_failed', 'failed', {
                omise_charge_id: chargeData.id,
                failure_code: chargeData.failure_code,
                failure_message: chargeData.failure_message,
            });

            this.logger.log(`✅ Successfully processed charge failed: ${chargeData.id}`);
        } catch (error) {
            this.logger.error(`❌ Failed to process charge failed: ${chargeData.id}`, error);
            throw error;
        }
    }

    /**
     * Handle charge cancel
     */
    private async handleChargeCancel(chargeData: any) {
        this.logger.log(`🚫 Charge cancelled: ${chargeData.id}`);

        try {
            // หา payment ใน database
            const payment = await this.paymentRepository.findOne({
                where: { omise_charge_id: chargeData.id },
                relations: ['seat'],
            });

            if (!payment) {
                this.logger.warn(`⚠️ Payment not found for charge: ${chargeData.id}`);
                return;
            }

            // อัปเดต payment status
            await this.paymentRepository.update(payment.id, {
                status: PaymentStatus.CANCELLED,
                updated_at: new Date(),
            });

            // ปลดล็อก seat
            await this.seatRepository.update(payment.seat_id, {
                status: SeatStatus.AVAILABLE,
                reserved_until: null,
                reserved_by: null,
                updated_at: new Date(),
            });

            // บันทึก log
            await this.logWebhookEvent(payment.id, 'charge_cancel', 'cancelled', {
                omise_charge_id: chargeData.id,
                cancelled_at: chargeData.cancelled_at,
            });

            this.logger.log(`✅ Successfully processed charge cancel: ${chargeData.id}`);
        } catch (error) {
            this.logger.error(`❌ Failed to process charge cancel: ${chargeData.id}`, error);
            throw error;
        }
    }

    /**
     * บันทึก webhook event log
     */
    private async logWebhookEvent(
        paymentId: string,
        action: string,
        status: string,
        metadata: any,
    ) {
        const log = this.paymentLogRepository.create({
            payment_id: paymentId,
            level: LogLevel.INFO,
            message: `Webhook event: ${action}`,
            action,
            status,
            metadata: {
                ...metadata,
                webhook_received_at: new Date().toISOString(),
            },
        });

        await this.paymentLogRepository.save(log);
    }
}
