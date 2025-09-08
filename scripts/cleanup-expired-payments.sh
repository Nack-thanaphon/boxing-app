#!/bin/bash

# Script สำหรับ cleanup expired payments
# รันทุก 5 นาทีผ่าน cron

echo "$(date): Starting payment cleanup..."

# เรียก API endpoint สำหรับ cleanup
curl -X POST http://payment-service:3000/cron/cleanup-payments \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo "$(date): Payment cleanup completed"
