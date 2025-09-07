import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { PaymentsModule } from '../payments/payments.module';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [
    PaymentsModule,
    LoggerModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
