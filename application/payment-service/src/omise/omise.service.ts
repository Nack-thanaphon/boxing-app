import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Omise from 'omise';

@Injectable()
export class OmiseService {
    private readonly logger = new Logger(OmiseService.name);
    private omiseClient: any;

    constructor(private configService: ConfigService) {
        this.initializeOmise();
    }

    private initializeOmise() {
        const publicKey = this.configService.get<string>('OMISE_PUBLIC_KEY');
        const secretKey = this.configService.get<string>('OMISE_SECRET_KEY');

        if (!publicKey || !secretKey) {
            throw new Error('Omise keys are not configured');
        }

        this.omiseClient = Omise({
            publicKey,
            secretKey,
        });

        this.logger.log('✅ Omise client initialized');
    }

    /**
     * Cancel charge กับ Omise
     */
    async cancelCharge(chargeId: string) {
        try {
            this.logger.log(`🚫 Cancelling charge: ${chargeId}`);

            // ตรวจสอบว่าเป็น mock charge หรือไม่
            if (chargeId.startsWith('mock_charge_')) {
                this.logger.log(`🔧 MOCK MODE: Simulating charge cancellation for ${chargeId}`);
                return {
                    id: chargeId,
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                };
            }

            // ใช้ method ที่ถูกต้องสำหรับ Omise
            const charge = await this.omiseClient.charges.update(chargeId, {
                status: 'cancelled'
            });

            this.logger.log(`✅ Successfully cancelled charge: ${chargeId}`);

            return charge;
        } catch (error) {
            this.logger.error(`❌ Failed to cancel charge ${chargeId}:`, error);
            throw error;
        }
    }

    /**
     * Get charge details
     */
    async getCharge(chargeId: string) {
        try {
            this.logger.log(`📋 Getting charge details: ${chargeId}`);

            // ตรวจสอบว่าเป็น mock charge หรือไม่
            if (chargeId.startsWith('mock_charge_')) {
                this.logger.log(`🔧 MOCK MODE: Simulating charge retrieval for ${chargeId}`);
                return {
                    id: chargeId,
                    status: 'successful',
                    amount: 403000,
                    currency: 'thb',
                    created: new Date().toISOString(),
                    paid: true,
                    paid_at: new Date().toISOString(),
                };
            }

            const charge = await this.omiseClient.charges.retrieve(chargeId);

            return charge;
        } catch (error) {
            this.logger.error(`❌ Failed to get charge ${chargeId}:`, error);
            throw error;
        }
    }

    /**
     * Create charge
     */
    async createCharge(chargeData: any) {
        try {
            this.logger.log(`💳 Creating charge: ${chargeData.amount} ${chargeData.currency}`);

            const charge = await this.omiseClient.charges.create(chargeData);

            this.logger.log(`✅ Successfully created charge: ${charge.id}`);

            return charge;
        } catch (error) {
            this.logger.error(`❌ Failed to create charge:`, error);
            throw error;
        }
    }

    /**
     * Create source
     */
    async createSource(sourceData: any) {
        try {
            this.logger.log(`🔗 Creating source: ${sourceData.type}`);

            const source = await this.omiseClient.sources.create(sourceData);

            this.logger.log(`✅ Successfully created source: ${source.id}`);

            return source;
        } catch (error) {
            this.logger.error(`❌ Failed to create source:`, error);
            throw error;
        }
    }

    /**
     * Create token
     */
    async createToken(tokenData: any) {
        try {
            this.logger.log(`🔑 Creating token for card`);

            const token = await this.omiseClient.tokens.create(tokenData);

            this.logger.log(`✅ Successfully created token: ${token.id}`);

            return token;
        } catch (error) {
            this.logger.error(`❌ Failed to create token:`, error);
            throw error;
        }
    }
}
