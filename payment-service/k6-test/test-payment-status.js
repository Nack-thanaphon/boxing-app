#!/usr/bin/env node

/**
 * Test script to verify payment status API
 * Usage: node test-payment-status.js <payment_id>
 */

const axios = require('axios');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3000';

async function testPaymentStatus(paymentId) {
    try {
        console.log(`Testing payment status for ID: ${paymentId}`);

        // Test status endpoint
        const statusResponse = await axios.get(`${PAYMENT_SERVICE_URL}/api/v1/payments/${paymentId}/status`);
        console.log('✅ Status Response:', statusResponse.data);

        // Test full payment details
        const fullResponse = await axios.get(`${PAYMENT_SERVICE_URL}/api/v1/payments/${paymentId}`);
        console.log('✅ Full Payment Details:', {
            id: fullResponse.data.id,
            status: fullResponse.data.status,
            payment_method: fullResponse.data.payment_method,
            amount: fullResponse.data.amount,
            created_at: fullResponse.data.created_at
        });

        // Test all payments
        const allPaymentsResponse = await axios.get(`${PAYMENT_SERVICE_URL}/api/v1/payments`);
        console.log(`✅ All Payments Count: ${allPaymentsResponse.data.length}`);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Get payment ID from command line argument
const paymentId = process.argv[2];

if (!paymentId) {
    console.log('Usage: node test-payment-status.js <payment_id>');
    console.log('Example: node test-payment-status.js 1ab1c100-63f1-43d9-a0a5-68827ff0f33f');
    process.exit(1);
}

testPaymentStatus(paymentId);
