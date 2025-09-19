# Payment Implementation Guide

## Overview

This document provides comprehensive answers to your payment implementation questions and explains how the complete payment system works.

## 1. How to Get Payment Status from Backend

### Backend API Endpoints

#### Get Payment Status

```http
GET /api/v1/payments/{payment_id}/status
```

**Response:**

```json
{
  "id": "payment-uuid",
  "status": "paid|pending|failed|cancelled",
  "omise_charge_id": "chrg_test_xxx"
}
```

#### Get Full Payment Details

```http
GET /api/v1/payments/{payment_id}
```

**Response:**

```json
{
  "id": "payment-uuid",
  "omise_charge_id": "chrg_test_xxx",
  "amount": 353000,
  "currency": "thb",
  "status": "paid",
  "payment_method": "promptpay",
  "customer_email": "user@example.com",
  "description": "Payment for reservation",
  "seat_id": "seat-uuid",
  "metadata": { ... },
  "created_at": "2025-09-06T15:49:47.633Z",
  "updated_at": "2025-09-06T15:49:47.633Z"
}
```

### Frontend Implementation

```typescript
import { getPaymentStatus } from '@/service/payment.service';

// Check payment status
const statusResult = await getPaymentStatus(paymentId);
if (statusResult.status === 'paid') {
  // Payment successful
  router.push(`/booking/success?id=${paymentId}`);
}
```

## 2. Credit Card Payment Implementation

### Backend Processing

- **Tokenization**: Card details are sent to backend and tokenized using Omise API
- **Security**: Card details never stored, only Omise tokens
- **Validation**: All card fields validated before processing

### Frontend Card Form

```typescript
const cardData = {
  card_number: '4111111111111111',
  card_name: 'John Doe',
  expiration_month: '12',
  expiration_year: '2025',
  security_code: '123',
};

await createPayment({
  amount: 353000,
  currency: 'thb',
  payment_method: 'card',
  seat_id: seatId,
  customer_email: email,
  ...cardData,
});
```

### Supported Card Types

- Visa
- Mastercard
- American Express
- JCB
- UnionPay

## 3. Payment Methods Coverage

### ✅ Fully Implemented Methods

| Method            | Frontend | Backend | Webhook | Status   |
| ----------------- | -------- | ------- | ------- | -------- |
| Credit/Debit Card | ✅       | ✅      | ✅      | Complete |
| PromptPay (QR)    | ✅       | ✅      | ✅      | Complete |
| TrueMoney         | ✅       | ✅      | ✅      | Complete |
| SCB Banking       | ✅       | ✅      | ✅      | Complete |
| BAY Banking       | ✅       | ✅      | ✅      | Complete |
| BBL Banking       | ✅       | ✅      | ✅      | Complete |

**Note:** PromptPay includes QR code functionality - no separate QR_CODE method needed.

### Payment Flow

1. **Frontend**: User selects payment method
2. **Backend**: Creates Omise charge/source
3. **Omise**: Processes payment
4. **Webhook**: Updates payment status
5. **Frontend**: Polls status and redirects on success

## 4. Database Logging

### ✅ Logs are Stored in Database

#### Payment Logs Table

```sql
CREATE TABLE payment_logs (
  id UUID PRIMARY KEY,
  level VARCHAR(10) NOT NULL, -- info, warn, error, debug
  message VARCHAR(255) NOT NULL,
  metadata JSON,
  payment_id VARCHAR(255),
  omise_charge_id VARCHAR(255),
  action VARCHAR(100),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Log Examples

```json
{
  "level": "info",
  "message": "Payment created successfully",
  "metadata": {
    "payment_id": "1ab1c100-63f1-43d9-a0a5-68827ff0f33f",
    "charge_id": "chrg_test_64ypmv0fzh8ui4o7jhd"
  },
  "payment_id": "1ab1c100-63f1-43d9-a0a5-68827ff0f33f",
  "omise_charge_id": "chrg_test_64ypmv0fzh8ui4o7jhd",
  "action": "create_payment",
  "status": "pending"
}
```

## 5. Complete Payment Flow

### Step-by-Step Process

1. **User Initiates Payment**
   - Frontend collects payment details
   - Validates form data
   - Calls `/api/v1/payments/create`

2. **Backend Processing**
   - Validates payment data
   - Creates Omise charge/source
   - Reserves seat (if applicable)
   - Stores payment record
   - Logs transaction

3. **Payment Processing**
   - **Card**: Tokenizes and charges immediately
   - **QR/PromptPay**: Creates QR code for scanning
   - **Banking**: Redirects to bank authorization

4. **Status Updates**
   - Webhook receives Omise notifications
   - Updates payment status in database
   - Logs status changes

5. **Frontend Response**
   - Polls payment status every 3 seconds
   - Shows QR code for QR payments
   - Redirects on success/failure
   - Closes popups automatically

## 6. Error Handling

### Backend Errors

- Input validation errors
- Omise API errors
- Database errors
- Webhook verification errors

### Frontend Errors

- Network errors
- Payment failures
- Timeout handling
- User cancellation

### Logging

- All errors logged to database
- Winston logs to files
- Structured error metadata

## 7. Security Features

### Data Protection

- Card details never stored
- Omise tokenization
- Webhook signature verification
- Input validation and sanitization

### Payment Security

- PCI DSS compliance via Omise
- Encrypted communication
- Secure token handling
- Fraud protection

## 8. Testing

### Test Card Numbers

```
Visa: 4111111111111111
Mastercard: 5555555555554444
Amex: 378282246310005
```

### Test Environment

- Omise test keys configured
- Mock seat reservations
- Test webhook endpoints
- Development logging

## 9. Monitoring & Debugging

### Database Queries

```sql
-- Check payment status
SELECT id, status, payment_method, created_at
FROM payments
WHERE id = 'payment-uuid';

-- View payment logs
SELECT level, message, action, status, created_at
FROM payment_logs
WHERE payment_id = 'payment-uuid'
ORDER BY created_at DESC;

-- Check seat status
SELECT id, status, reserved_until, reserved_by
FROM seats
WHERE id = 'seat-uuid';
```

### Log Files

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Database logs - Structured payment data

## 10. Deployment Checklist

### Environment Variables

```env
OMISE_PUBLIC_KEY=pkey_test_xxx
OMISE_SECRET_KEY=skey_test_xxx
OMISE_WEBHOOK_SECRET=webhook_secret_xxx
FRONTEND_URL=https://your-frontend.com
DATABASE_URL=postgresql://...
```

### Webhook Configuration

- Set webhook URL: `https://your-api.com/api/payment/webhook`
- Configure events: `charge.complete`, `charge.failed`, `charge.pending`
- Verify signature validation

### Database Setup

- Run migrations
- Create indexes
- Set up monitoring

## Conclusion

Your payment implementation is comprehensive and covers all major payment methods. The system includes:

✅ **Complete Payment Methods**: All 6 payment methods implemented (PromptPay includes QR functionality)
✅ **Real-time Status Updates**: Webhook + polling system
✅ **Database Logging**: All transactions logged
✅ **Security**: PCI compliant via Omise
✅ **Error Handling**: Comprehensive error management
✅ **User Experience**: Smooth payment flow with proper feedback

The system is production-ready and follows best practices for payment processing.
