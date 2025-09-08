import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OmiseWebhookController } from './omise-webhook.controller';
import { Payment } from '../database/entities/payment.entity';
import { PaymentLog } from '../database/entities/payment-log.entity';
import { Seat } from '../database/entities/seat.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Payment, PaymentLog, Seat])],
    controllers: [OmiseWebhookController],
})
export class WebhooksModule { }
