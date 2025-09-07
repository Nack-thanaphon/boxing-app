#!/usr/bin/env node

/**
 * Test script to verify cancel payment functionality
 * Usage: node test-cancel-payment.js <payment_id>
 */

const axios = require('axios');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3000';

async function testCancelPayment(paymentId) {
    try {
        console.log(`Testing cancel payment for ID: ${paymentId}`);

        // First check current status
        console.log('1. Checking current payment status...');
        const statusResponse = await axios.get(`${PAYMENT_SERVICE_URL}/api/v1/payments/${paymentId}/status`);
        console.log('Current status:', statusResponse.data);

        if (statusResponse.data.status !== 'pending') {
            console.log('❌ Payment is not pending, cannot cancel');
            return;
        }

        // Cancel payment
        console.log('2. Cancelling payment...');
        const cancelResponse = await axios.post(`${PAYMENT_SERVICE_URL}/api/v1/payments/${paymentId}/cancel`);
        console.log('✅ Cancel response:', cancelResponse.data);

        // Check status after cancel
        console.log('3. Checking status after cancel...');
        const finalStatusResponse = await axios.get(`${PAYMENT_SERVICE_URL}/api/v1/payments/${paymentId}/status`);
        console.log('Final status:', finalStatusResponse.data);

        if (finalStatusResponse.data.status === 'cancelled') {
            console.log('✅ Payment cancelled successfully!');
        } else {
            console.log('❌ Payment was not cancelled properly');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Get payment ID from command line argument
const paymentId = process.argv[2];

if (!paymentId) {
    console.log('Usage: node test-cancel-payment.js <payment_id>');
    console.log('Example: node test-cancel-payment.js 1ab1c100-63f1-43d9-a0a5-68827ff0f33f');
    process.exit(1);
}

testCancelPayment(paymentId);
