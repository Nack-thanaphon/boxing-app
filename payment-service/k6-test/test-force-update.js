#!/usr/bin/env node

/**
 * Test script to verify force update payment status
 * Usage: node test-force-update.js <payment_id>
 */

const axios = require('axios');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3000';

async function testForceUpdate(paymentId) {
    try {
        console.log(`Testing force update for payment ID: ${paymentId}`);

        // First check current status
        console.log('1. Checking current payment status...');
        const statusResponse = await axios.get(`${PAYMENT_SERVICE_URL}/api/v1/payments/${paymentId}/status`);
        console.log('Current status:', statusResponse.data);

        // Force update from Omise
        console.log('2. Force updating payment status from Omise...');
        const forceUpdateResponse = await axios.post(`${PAYMENT_SERVICE_URL}/api/v1/payments/${paymentId}/force-update`);
        console.log('Force update result:', forceUpdateResponse.data);

        // Check final status
        console.log('3. Checking final status...');
        const finalStatusResponse = await axios.get(`${PAYMENT_SERVICE_URL}/api/v1/payments/${paymentId}/status`);
        console.log('Final status:', finalStatusResponse.data);

        if (forceUpdateResponse.data.status === 'paid') {
            console.log('✅ Payment confirmed as paid!');
        } else {
            console.log(`ℹ️  Payment status: ${forceUpdateResponse.data.status}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Get payment ID from command line argument
const paymentId = process.argv[2];

if (!paymentId) {
    console.log('Usage: node test-force-update.js <payment_id>');
    console.log('Example: node test-force-update.js 1ab1c100-63f1-43d9-a0a5-68827ff0f33f');
    process.exit(1);
}

testForceUpdate(paymentId);
