import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
} from '../database/entities/payment.entity';
import { Seat, SeatStatus } from '../database/entities/seat.entity';
import { LoggerService } from '../common/logger/logger.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentMethodsResponse, PaymentMethodDto } from './dto/payment-method.dto';
import * as omise from 'omise';

@Injectable()
export class PaymentsService {
  private omiseClient: any;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,
    private loggerService: LoggerService,
  ) {
    this.omiseClient = omise({
      publicKey: process.env.OMISE_PUBLIC_KEY,
      secretKey: process.env.OMISE_SECRET_KEY,
    });
  }

  async createPayment(
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponse> {
    const {
      amount,
      currency,
      payment_method,
      seat_id,
      customer_email,
      token,
    } = createPaymentDto;

    console.log('Received payment_method:', payment_method);

    try {
      let tokenToUse: string | null = token || null;

      // Handle card tokenization on the backend
      if (payment_method === PaymentMethod.CARD) {
        const { card_number, card_name, expiration_month, expiration_year, security_code } = createPaymentDto;

        if (!card_number || !card_name || !expiration_month || !expiration_year || !security_code) {
          throw new Error('Card details are incomplete for tokenization');
        }

        // Check if we're in mock mode (enabled for testing)
        const isMockMode = true;

        if (isMockMode) {
          console.log('🔧 MOCK MODE: Creating mock card token');
          tokenToUse = `mock_token_${Date.now()}`;
        } else {
          const omiseToken = await this.omiseClient.tokens.create({
            card: {
              number: card_number,
              name: card_name,
              expiration_month,
              expiration_year,
              security_code,
            },
          });
          tokenToUse = omiseToken.id;
        }
      }

      // Check if seat is available if seat_id is provided
      let seat = null;
      if (seat_id) {
        seat = await this.seatRepository.findOne({ where: { id: seat_id } });
        console.log('Seat:', seat);
        if (!seat) {
          throw new NotFoundException('Seat not found');
        }
        if (seat.status !== SeatStatus.AVAILABLE) {
          throw new Error('Seat is not available');
        }
      }

      // TEMPORARY DEBUGGING LINE - REMOVE IN PRODUCTION
      // const seat_id = "387f46a9-3c91-41f8-885d-fd57ab43cf84"

      let charge: any;
      let omiseSourceId: string | null = null;

      const omiseAmount = Math.round(amount);
      const omiseCurrency = currency || 'THB';
      const omiseDescription = 'Payment for reservation';
      const omiseMetadata = { seat_id, customer_email };

      let omiseSourceType: string;

      // MOCK PAYMENT FOR TESTING - ENABLED FOR TESTING
      const isMockMode = true;


      if (isMockMode) {
        console.log('🔧 MOCK MODE: Creating mock payment response');

        // Create mock charge response
        charge = {
          id: `mock_charge_${Date.now()}`,
          status: 'pending',
          amount: omiseAmount,
          currency: omiseCurrency,
          description: omiseDescription,
          metadata: omiseMetadata,
          created: new Date().toISOString(),
        };

        // Add mock source for QR code payments
        if ([PaymentMethod.PROMPT_PAY, PaymentMethod.WECHAT_PAY].includes(payment_method)) {
          charge.source = {
            id: `mock_source_${Date.now()}`,
            type: payment_method === PaymentMethod.PROMPT_PAY ? 'promptpay' : 'wechat',
            references: {
              qr_code: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`
            },
            scannable_code: {
              image: {
                download_uri: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`
              }
            }
          };
        }

        // Add mock authorize URI for banking payments
        if ([PaymentMethod.TRUE_MONEY, PaymentMethod.INTERNET_BANKING_SCB,
        PaymentMethod.INTERNET_BANKING_BAY, PaymentMethod.INTERNET_BANKING_BBL,
        PaymentMethod.INTERNET_BANKING_KBANK, PaymentMethod.INTERNET_BANKING_KTB].includes(payment_method)) {
          charge.authorize_uri = `https://mock-bank-redirect.com/authorize?payment_id=${charge.id}`;
        }

        // Mock successful card payment
        if (payment_method === PaymentMethod.CARD) {
          charge.status = 'successful';
          charge.paid = true;
          charge.paid_at = new Date().toISOString();
        }

      } else {
        // REAL OMISE INTEGRATION
        switch (payment_method) {
          case PaymentMethod.CARD:
            if (!tokenToUse) {
              throw new Error('Card token is required for card payments');
            }
            charge = await this.omiseClient.charges.create({
              amount: omiseAmount,
              currency: omiseCurrency,
              card: tokenToUse,
              description: omiseDescription,
              metadata: omiseMetadata,
            });
            break;
          case PaymentMethod.PROMPT_PAY:
            omiseSourceType = 'promptpay';
            break;
          case PaymentMethod.TRUE_MONEY:
            omiseSourceType = 'truemoney';
            break;
          case PaymentMethod.WECHAT_PAY:
            omiseSourceType = 'wechat';
            break;
          case PaymentMethod.INTERNET_BANKING_SCB:
            omiseSourceType = 'internet_banking_scb';
            break;
          case PaymentMethod.INTERNET_BANKING_BAY:
            omiseSourceType = 'internet_banking_bay';
            break;
          case PaymentMethod.INTERNET_BANKING_BBL:
            omiseSourceType = 'internet_banking_bbl';
            break;
          case PaymentMethod.INTERNET_BANKING_KBANK:
            omiseSourceType = 'internet_banking_kbank';
            break;
          case PaymentMethod.INTERNET_BANKING_KTB:
            omiseSourceType = 'internet_banking_ktb';
            break;
          case PaymentMethod.BANK_TRANSFER:
            // For bank transfer, we'll create a special handling
            omiseSourceType = 'bill_payment_tesco_lotus';
            break;
          default:
            throw new Error('Unsupported payment method');
        }
      }

      if (!isMockMode && payment_method !== PaymentMethod.CARD) {
        // Create source for non-card payments (REAL OMISE)
        const source = await this.omiseClient.sources.create({
          amount: omiseAmount,
          currency: omiseCurrency,
          type: omiseSourceType,
        });
        omiseSourceId = source.id;
        charge = await this.omiseClient.charges.create({
          amount: omiseAmount,
          currency: omiseCurrency,
          source: omiseSourceId,
          return_uri: process.env.FRONTEND_URL,
          description: omiseDescription,
          metadata: omiseMetadata,
        });
      }

      // Create payment record
      const payment = this.paymentRepository.create({
        omise_charge_id: charge.id,
        amount,
        currency: omiseCurrency,
        status: PaymentStatus.PENDING,
        payment_method: payment_method as PaymentMethod,
        customer_email,
        description: omiseDescription,
        seat_id,
        metadata: {
          omise_charge: charge,
          omise_source_id: omiseSourceId,
          ...(payment_method === PaymentMethod.PROMPT_PAY &&
            charge.source.scannable_code &&
            charge.source.scannable_code.image && {
            qr_code_url: charge.source.scannable_code.image.download_uri,
            expires_at: charge.expires_at,
          }),
        },
      });

      const savedPayment = await this.paymentRepository.save(payment);

      // Reserve seat if provided
      if (seat) {
        seat.status = SeatStatus.RESERVED;
        seat.reserved_until = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        seat.reserved_by = customer_email;
        await this.seatRepository.save(seat);
      }

      await this.loggerService.logPayment(
        'info',
        'Payment created successfully',
        { payment_id: savedPayment.id, charge_id: charge.id },
        savedPayment.id,
        charge.id,
        'create_payment',
        'pending',
      );

      const response: PaymentResponse = {
        id: savedPayment.id,
        status: savedPayment.status,
      };

      if (payment_method === PaymentMethod.PROMPT_PAY) {
        if (charge.source.scannable_code?.image?.download_uri && charge.expires_at) {
          response.qrCodeUrl = charge.source.scannable_code.image.download_uri;
          response.expiresAt = charge.expires_at;
        }
      }

      if (charge.authorize_uri) {
        response.authorizeUri = charge.authorize_uri;
      }

      return response;
    } catch (error) {
      await this.loggerService.logPayment(
        'error',
        'Failed to create payment',
        { error: error.message, ...createPaymentDto },
        null,
        null,
        'create_payment',
        'failed',
      );
      throw error;
    }
  }

  async getPayment(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['seat'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getPayments(): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: ['seat'],
      order: { created_at: 'DESC' },
    });
  }

  async getPaymentStatus(id: string): Promise<{ id: string; status: string; omise_charge_id: string }> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      select: ['id', 'status', 'omise_charge_id'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check with Omise API if payment is still pending
    if (payment.status === 'pending' && payment.omise_charge_id) {
      try {
        const omiseCharge = await this.omiseClient.charges.retrieve(payment.omise_charge_id);

        if (omiseCharge.status === 'successful' && omiseCharge.paid) {
          // Update payment status to paid
          await this.updatePaymentStatus(payment.omise_charge_id, PaymentStatus.PAID);

          return {
            id: payment.id,
            status: 'paid',
            omise_charge_id: payment.omise_charge_id,
          };
        } else if (omiseCharge.status === 'failed') {
          // Update payment status to failed
          await this.updatePaymentStatus(payment.omise_charge_id, PaymentStatus.FAILED);

          return {
            id: payment.id,
            status: 'failed',
            omise_charge_id: payment.omise_charge_id,
          };
        }
      } catch (error) {
        console.error('Error checking Omise charge status:', error);
        // Continue with local status if Omise check fails
      }
    }

    return {
      id: payment.id,
      status: payment.status,
      omise_charge_id: payment.omise_charge_id,
    };
  }

  async updatePaymentStatus(
    omiseChargeId: string,
    status: PaymentStatus,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { omise_charge_id: omiseChargeId },
      relations: ['seat'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = status;
    const updatedPayment = await this.paymentRepository.save(payment);

    // Update seat status based on payment status
    if (payment.seat) {
      if (status === PaymentStatus.PAID) {
        payment.seat.status = SeatStatus.OCCUPIED;
        payment.seat.reserved_until = null;
      } else if (
        status === PaymentStatus.FAILED ||
        status === PaymentStatus.CANCELLED
      ) {
        payment.seat.status = SeatStatus.AVAILABLE;
        payment.seat.reserved_until = null;
        payment.seat.reserved_by = null;
      }
      await this.seatRepository.save(payment.seat);
    }

    await this.loggerService.logPayment(
      'info',
      `Payment status updated to ${status}`,
      { payment_id: payment.id },
      payment.id,
      omiseChargeId,
      'update_status',
      status,
    );

    return updatedPayment;
  }

  async cancelPayment(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['seat'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error('Only pending payments can be cancelled');
    }

    // Try to cancel with Omise if possible
    try {
      if (payment.omise_charge_id) {
        await this.omiseClient.charges.reverse(payment.omise_charge_id);
      }
    } catch (error) {
      // Log error but continue with local cancellation
      await this.loggerService.logPayment(
        'warn',
        'Failed to cancel payment with Omise',
        { error: error.message, omise_charge_id: payment.omise_charge_id },
        payment.id,
        payment.omise_charge_id,
        'cancel_payment',
        'warning',
      );
    }

    // Update payment status to cancelled
    payment.status = PaymentStatus.CANCELLED;
    const updatedPayment = await this.paymentRepository.save(payment);

    // Release seat if reserved
    if (payment.seat) {
      payment.seat.status = SeatStatus.AVAILABLE;
      payment.seat.reserved_until = null;
      payment.seat.reserved_by = null;
      await this.seatRepository.save(payment.seat);
    }

    await this.loggerService.logPayment(
      'info',
      'Payment cancelled successfully',
      { payment_id: payment.id },
      payment.id,
      payment.omise_charge_id,
      'cancel_payment',
      'cancelled',
    );

    return updatedPayment;
  }

  async forceUpdatePaymentStatus(id: string): Promise<{ id: string; status: string; omise_charge_id: string }> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      select: ['id', 'status', 'omise_charge_id'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (!payment.omise_charge_id) {
      throw new Error('No Omise charge ID found');
    }

    try {
      const omiseCharge = await this.omiseClient.charges.retrieve(payment.omise_charge_id);

      let newStatus: PaymentStatus;
      if (omiseCharge.status === 'successful' && omiseCharge.paid) {
        newStatus = PaymentStatus.PAID;
      } else if (omiseCharge.status === 'failed') {
        newStatus = PaymentStatus.FAILED;
      } else {
        newStatus = PaymentStatus.PENDING;
      }

      // Update payment status if it changed
      if (payment.status !== newStatus) {
        await this.updatePaymentStatus(payment.omise_charge_id, newStatus);
      }

      return {
        id: payment.id,
        status: newStatus,
        omise_charge_id: payment.omise_charge_id,
      };
    } catch (error) {
      console.error('Error force updating payment status:', error);
      throw new Error('Failed to update payment status from Omise');
    }
  }

  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    const methods: PaymentMethodDto[] = [
      // Credit/Debit Card
      {
        id: 'card',
        name: 'Credit/Debit Card',
        icon: 'credit_card',
        enabled: true,
        type: 'card',
        description: 'Visa, Mastercard, American Express, JCB, UnionPay',
        min_amount: 100,
        max_amount: 1000000,
      },

      // QR Code Payments
      {
        id: 'promptpay',
        name: 'PromptPay',
        icon: 'qr_code',
        enabled: true,
        type: 'qr_code',
        description: 'Scan QR Code with your banking app',
        supports_qr_code: true,
        min_amount: 100,
        max_amount: 1000000,
      },

      // Digital Wallets
      {
        id: 'truemoney',
        name: 'TrueMoney Wallet',
        icon: 'wallet',
        enabled: true,
        type: 'wallet',
        description: 'Pay with TrueMoney Wallet',
        requires_redirect: true,
        min_amount: 100,
        max_amount: 1000000,
      },
      {
        id: 'wechat_pay',
        name: 'WeChat Pay',
        icon: 'wechat',
        enabled: true,
        type: 'wallet',
        description: 'Pay with WeChat Pay',
        supports_qr_code: true,
        min_amount: 100,
        max_amount: 1000000,
      },

      // Internet Banking
      {
        id: 'internet_banking_scb',
        name: 'SCB Banking',
        icon: 'banking',
        enabled: true,
        type: 'banking',
        description: 'Siam Commercial Bank',
        requires_redirect: true,
        bank_code: 'scb',
        min_amount: 100,
        max_amount: 1000000,
      },
      {
        id: 'internet_banking_bay',
        name: 'BAY Banking',
        icon: 'banking',
        enabled: true,
        type: 'banking',
        description: 'Bank of Ayudhya',
        requires_redirect: true,
        bank_code: 'bay',
        min_amount: 100,
        max_amount: 1000000,
      },
      {
        id: 'internet_banking_bbl',
        name: 'BBL Banking',
        icon: 'banking',
        enabled: true,
        type: 'banking',
        description: 'Bangkok Bank',
        requires_redirect: true,
        bank_code: 'bbl',
        min_amount: 100,
        max_amount: 1000000,
      },
      {
        id: 'internet_banking_kbank',
        name: 'KBank Banking',
        icon: 'banking',
        enabled: true,
        type: 'banking',
        description: 'Kasikorn Bank',
        requires_redirect: true,
        bank_code: 'kbank',
        min_amount: 100,
        max_amount: 1000000,
      },
      {
        id: 'internet_banking_ktb',
        name: 'KTB Banking',
        icon: 'banking',
        enabled: true,
        type: 'banking',
        description: 'Krung Thai Bank',
        requires_redirect: true,
        bank_code: 'ktb',
        min_amount: 100,
        max_amount: 1000000,
      },

      // Bank Transfer
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        icon: 'bank_transfer',
        enabled: true,
        type: 'banking',
        description: 'Manual bank transfer',
        requires_redirect: false,
        min_amount: 100,
        max_amount: 1000000,
      },
    ];

    return {
      methods: methods.filter(method => method.enabled),
      default_method: 'card',
    };
  }
}

export interface PaymentResponse {
  id: string;
  status: string;
  qrCodeUrl?: string;
  expiresAt?: Date;
  authorizeUri?: string;
}
