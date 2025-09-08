# Payment Cleanup Cronjob Guide

## Overview

ระบบ cronjob สำหรับจัดการ payment ที่หมดเวลา โดยจะ:

1. ตรวจสอบ payment ที่ pending เกิน 15 นาที
2. Cancel payment กับ Omise
3. ปลดล็อก seat
4. บันทึก log

## Architecture

### 1. Payment Cleanup Service

- **File:** `application/payment-service/src/cron/payment-cleanup.service.ts`
- **Function:** จัดการ logic การ cleanup payment
- **API Endpoint:** `POST /cron/cleanup-payments`

### 2. Omise Webhook Handler

- **File:** `application/payment-service/src/webhooks/omise-webhook.controller.ts`
- **Endpoint:** `POST /webhooks/omise`
- **Function:** รับ callback จาก Omise เมื่อ payment เปลี่ยนแปลง

### 3. Cron Job Container

- **File:** `Dockerfile.cron`
- **Script:** `scripts/cleanup-expired-payments.sh`
- **Schedule:** ทุก 5 นาที

## Setup

### 1. Start Services

```bash
make dev
```

### 2. Manual Trigger

```bash
# ทดสอบ manual cleanup
curl -X POST http://localhost:3000/cron/cleanup-payments
```

### 3. Check Cron Logs

```bash
# ดู logs ของ cron job
docker-compose logs cron

# ดู logs ใน container
docker-compose exec cron cat /var/log/cleanup.log
```

## Webhook Configuration

### Omise Webhook URL

```
http://your-domain.com/webhooks/omise
```

### Webhook Events

- `charge.complete` - Payment สำเร็จ
- `charge.failed` - Payment ล้มเหลว
- `charge.cancel` - Payment ถูกยกเลิก

## Payment Status Flow

```
pending → (15 min timeout) → cancelled
pending → (webhook) → paid/failed/cancelled
```

## Seat Status Flow

```
available → reserved → (payment success) → occupied
available → reserved → (payment timeout/fail) → available
```

## Monitoring

### 1. Check Payment Logs

```bash
# ดู payment logs
curl -X GET http://localhost:3000/api/v1/payments/logs
```

### 2. Check Expired Payments

```sql
-- ดู payment ที่หมดเวลา
SELECT * FROM payments
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '15 minutes';
```

### 3. Check Seat Status

```sql
-- ดู seat ที่ถูก reserve
SELECT * FROM seats
WHERE status = 'reserved'
AND reserved_until < NOW();
```

## Troubleshooting

### 1. Cron Job ไม่ทำงาน

```bash
# ตรวจสอบ cron container
docker-compose ps cron

# ดู logs
docker-compose logs cron
```

### 2. Webhook ไม่ได้รับ

```bash
# ตรวจสอบ webhook endpoint
curl -X POST http://localhost:3000/webhooks/omise \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "data": {}}'
```

### 3. Payment ไม่ถูก cleanup

```bash
# Manual trigger
curl -X POST http://localhost:3000/cron/cleanup-payments

# ตรวจสอบ logs
docker-compose logs payment-service | grep "Payment cleanup"
```

## Configuration

### Environment Variables

```env
# Omise Configuration
OMISE_PUBLIC_KEY=pkey_test_xxx
OMISE_SECRET_KEY=skey_test_xxx
OMISE_WEBHOOK_SECRET=whsec_test_xxx

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=postgres
```

### Cron Schedule

```bash
# เปลี่ยน schedule ใน Dockerfile.cron
RUN echo "*/5 * * * * /usr/local/bin/cleanup-expired-payments.sh >> /var/log/cleanup.log 2>&1" | crontab -
```

## Security

### 1. Webhook Signature Verification

- ใช้ HMAC-SHA256 เพื่อ verify webhook signature
- ตรวจสอบ `x-omise-signature` header

### 2. API Protection

- Manual cleanup endpoint ควรมี authentication
- ใช้ HTTPS ใน production

## Production Deployment

### 1. Webhook URL

```
https://your-domain.com/webhooks/omise
```

### 2. SSL Certificate

- ใช้ Let's Encrypt หรือ SSL certificate อื่น
- Configure reverse proxy (nginx)

### 3. Monitoring

- ใช้ monitoring tools เช่น Prometheus, Grafana
- Set up alerts สำหรับ failed payments

## API Endpoints

### Manual Cleanup

```http
POST /cron/cleanup-payments
Content-Type: application/json

Response:
{
  "status": "success",
  "message": "Payment cleanup completed successfully"
}
```

### Webhook

```http
POST /webhooks/omise
Content-Type: application/json
x-omise-signature: <signature>

Body:
{
  "type": "charge.complete",
  "data": {
    "id": "chrg_xxx",
    "status": "successful",
    "amount": 20000,
    "currency": "thb"
  }
}
```
