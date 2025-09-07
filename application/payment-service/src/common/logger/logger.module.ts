import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerService } from './logger.service';
import { PaymentLog } from '../../database/entities/payment-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentLog]),
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
