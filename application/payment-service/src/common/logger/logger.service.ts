import { Injectable } from '@nestjs/common';
import { createLogger, Logger, format, transports } from 'winston';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentLog, LogLevel } from '../../database/entities/payment-log.entity';

@Injectable()
export class LoggerService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(PaymentLog)
    private readonly paymentLogRepository: Repository<PaymentLog>,
  ) {
    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
      ),
      transports: [
        new transports.Console({
          format: format.combine(format.colorize(), format.simple()),
        }),
        new transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    });
  }

  async logPayment(
    level: string,
    message: string,
    metadata?: any,
    paymentId?: string,
    omiseChargeId?: string,
    action?: string,
    status?: string,
  ) {
    const logData = {
      level,
      message,
      metadata,
      payment_id: paymentId,
      omise_charge_id: omiseChargeId,
      action,
      status,
      timestamp: new Date().toISOString(),
    };

    // Log to Winston
    this.logger.log(level, message, logData);

    // Store directly to database (instead of queuing)
    try {
      const paymentLog = this.paymentLogRepository.create({
        level: level as LogLevel,
        message,
        metadata,
        payment_id: paymentId,
        omise_charge_id: omiseChargeId,
        action,
        status,
      });

      await this.paymentLogRepository.save(paymentLog);
    } catch (error) {
      this.logger.error('Failed to store payment log to database', error);
    }
  }

  info(message: string, metadata?: any) {
    this.logger.info(message, metadata);
  }

  error(message: string, error?: Error, metadata?: any) {
    this.logger.error(message, { error: error?.stack, ...metadata });
  }

  warn(message: string, metadata?: any) {
    this.logger.warn(message, metadata);
  }

  debug(message: string, metadata?: any) {
    this.logger.debug(message, metadata);
  }
}
