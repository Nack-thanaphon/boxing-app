import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CleanupController } from './cleanup.controller';
import { Payment } from '../database/entities/payment.entity';
import { Seat } from '../database/entities/seat.entity';
import { PaymentLog } from '../database/entities/payment-log.entity';
import { LoggerModule } from '../common/logger/logger.module';
import { OmiseModule } from '../omise/omise.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Seat, PaymentLog]),
    LoggerModule,
    OmiseModule,
  ],
  controllers: [PaymentsController, CleanupController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule { }
