import { Controller, Post, Body, Headers, RawBody } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('api/payment/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async handleWebhook(
    @Body() body: any,
    @Headers() headers: any,
    @RawBody() rawBody: Buffer,
  ) {
    return this.webhookService.handleOmiseWebhook(body, headers, rawBody);
  }
}
