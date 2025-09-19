import { Controller, Post, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../database/entities/payment.entity';
import { Seat, SeatStatus } from '../database/entities/seat.entity';
import { PaymentLog, LogLevel } from '../database/entities/payment-log.entity';
import { OmiseService } from '../omise/omise.service';

@Controller('cron')
export class CleanupController {
    private readonly logger = new Logger(CleanupController.name);

    constructor(
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        @InjectRepository(Seat)
        private seatRepository: Repository<Seat>,
        @InjectRepository(PaymentLog)
        private paymentLogRepository: Repository<PaymentLog>,
        private omiseService: OmiseService,
    ) { }

    /**
     * Manual trigger สำหรับ payment cleanup
     */
    @Post('cleanup-payments')
    async triggerPaymentCleanup() {
        this.logger.log('🔧 Manual payment cleanup triggered');

        try {
            await this.handleExpiredPayments();
            return {
                status: 'success',
                message: 'Payment cleanup completed successfully'
            };
        } catch (error) {
            this.logger.error('❌ Manual payment cleanup failed:', error);
            return {
                status: 'error',
                message: 'Payment cleanup failed',
                error: error.message
            };
        }
    }

    /**
     * จัดการ payment ที่หมดเวลา
     */
    private async handleExpiredPayments() {
        this.logger.log('🔍 Starting payment cleanup job...');

        try {
            // หา payment ที่หมดเวลา (pending และ created_at เกิน 15 นาที)
            const expiredPayments = await this.findExpiredPayments();

            if (expiredPayments.length === 0) {
                this.logger.log('✅ No expired payments found');
                return;
            }

            this.logger.log(`📋 Found ${expiredPayments.length} expired payments`);

            // ประมวลผลแต่ละ payment ที่หมดเวลา
            for (const payment of expiredPayments) {
                await this.processExpiredPayment(payment);
            }

            this.logger.log('✅ Payment cleanup job completed');
        } catch (error) {
            this.logger.error('❌ Payment cleanup job failed:', error);
            throw error;
        }
    }

    /**
     * หา payment ที่หมดเวลา
     */
    private async findExpiredPayments(): Promise<Payment[]> {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        return await this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.seat', 'seat')
            .where('payment.status = :status', { status: PaymentStatus.PENDING })
            .andWhere('payment.created_at < :expiredTime', { expiredTime: fifteenMinutesAgo })
            .getMany();
    }

    /**
     * ประมวลผล payment ที่หมดเวลา
     */
    private async processExpiredPayment(payment: Payment) {
        this.logger.log(`🔄 Processing expired payment: ${payment.id}`);

        try {
            // 1. Cancel payment กับ Omise (ถ้ามี omise_charge_id)
            if (payment.omise_charge_id) {
                await this.cancelOmisePayment(payment);
            }

            // 2. อัปเดต payment status เป็น cancelled
            await this.updatePaymentStatus(payment.id, PaymentStatus.CANCELLED);

            // 3. ปลดล็อก seat
            await this.releaseSeat(payment.seat_id);

            // 4. บันทึก log
            await this.logPaymentExpiration(payment);

            this.logger.log(`✅ Successfully processed expired payment: ${payment.id}`);
        } catch (error) {
            this.logger.error(`❌ Failed to process expired payment ${payment.id}:`, error);

            // บันทึก error log
            await this.logPaymentError(payment, error);
        }
    }

    /**
     * Cancel payment กับ Omise
     */
    private async cancelOmisePayment(payment: Payment) {
        try {
            this.logger.log(`🚫 Cancelling Omise payment: ${payment.omise_charge_id}`);

            // เรียก Omise API เพื่อ cancel charge
            const cancelledCharge = await this.omiseService.cancelCharge(payment.omise_charge_id);

            this.logger.log(`✅ Successfully cancelled Omise payment: ${payment.omise_charge_id}`);

            return cancelledCharge;
        } catch (error) {
            this.logger.error(`❌ Failed to cancel Omise payment ${payment.omise_charge_id}:`, error);
            throw error;
        }
    }

    /**
     * อัปเดต payment status
     */
    private async updatePaymentStatus(paymentId: string, status: PaymentStatus) {
        await this.paymentRepository.update(paymentId, {
            status,
            updated_at: new Date(),
        });
    }

    /**
     * ปลดล็อก seat
     */
    private async releaseSeat(seatId: string) {
        await this.seatRepository.update(seatId, {
            status: SeatStatus.AVAILABLE,
            reserved_until: null,
            reserved_by: null,
            updated_at: new Date(),
        });
    }

    /**
     * บันทึก log การหมดเวลา
     */
    private async logPaymentExpiration(payment: Payment) {
        const log = this.paymentLogRepository.create({
            payment_id: payment.id,
            omise_charge_id: payment.omise_charge_id,
            level: LogLevel.INFO,
            message: 'Payment expired and cancelled',
            action: 'payment_expired',
            status: 'cancelled',
            metadata: {
                payment_id: payment.id,
                seat_id: payment.seat_id,
                customer_email: payment.customer_email,
                amount: payment.amount,
                currency: payment.currency,
                payment_method: payment.payment_method,
                expired_at: new Date().toISOString(),
            },
        });

        await this.paymentLogRepository.save(log);
    }

    /**
     * บันทึก error log
     */
    private async logPaymentError(payment: Payment, error: any) {
        const log = this.paymentLogRepository.create({
            payment_id: payment.id,
            omise_charge_id: payment.omise_charge_id,
            level: LogLevel.ERROR,
            message: 'Failed to process expired payment',
            action: 'payment_expired_error',
            status: 'error',
            metadata: {
                payment_id: payment.id,
                seat_id: payment.seat_id,
                customer_email: payment.customer_email,
                error: error.message,
                stack: error.stack,
                failed_at: new Date().toISOString(),
            },
        });

        await this.paymentLogRepository.save(log);
    }
}
