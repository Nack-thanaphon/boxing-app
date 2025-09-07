# Service Communication Guide

## Overview

This document explains how the 3 services communicate with each other in both development and production environments.

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │ Payment Service │
│   (Next.js)     │    │   (Express.js)  │    │   (NestJS)      │
│   Port: 3001    │    │   Port: 3002    │    │   Port: 3000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Port: 5432    │
                    └─────────────────┘
```

## Communication Patterns

### 1. Frontend → Backend

- **Purpose**: User authentication, fight data, stadium information
- **Protocol**: HTTP/HTTPS
- **URLs**:
  - Dev: `http://localhost:3002/api`
  - Prod: `https://yourdomain.com/api`

### 2. Frontend → Payment Service

- **Purpose**: Payment processing, booking management
- **Protocol**: HTTP/HTTPS
- **URLs**:
  - Dev: `http://localhost:3000/api/v1`
  - Prod: `https://yourdomain.com/payment`

### 3. Backend → Payment Service

- **Purpose**: Payment verification, booking confirmation
- **Protocol**: HTTP/HTTPS (Internal Docker Network)
- **URLs**:
  - Dev: `http://payment-service:3000/api/v1`
  - Prod: `http://payment-service:3000/api/v1`

## Environment Variables

### Frontend (Next.js)

```bash
# External URLs (for browser requests)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3002
NEXT_PUBLIC_PAYMENT_SERVICE_URL=http://localhost:3000
```

### Backend (Express.js)

```bash
# Internal URLs (for server-to-server requests)
PAYMENT_SERVICE_URL=http://payment-service:3000
```

### Payment Service (NestJS)

```bash
# External URLs (for webhooks and redirects)
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://backend:3002
```

## API Endpoints

### Backend API (`/api`)

- `GET /api/health` - Health check
- `POST /api/auth/login` - User login
- `GET /api/fights` - Get fights list
- `GET /api/stadiums` - Get stadiums list
- `POST /api/bookings` - Create booking

### Payment Service API (`/payment`)

- `GET /payment/health` - Health check
- `POST /payment/create` - Create payment
- `GET /payment/status/:id` - Check payment status
- `POST /payment/webhook` - Payment webhook

## Docker Network Communication

In Docker Compose, services communicate using service names:

```yaml
# Frontend can reach backend via:
http://backend:3002

# Backend can reach payment service via:
http://payment-service:3000

# All services can reach database via:
postgres:5432
```

## CORS Configuration

### Backend CORS

```javascript
const corsOptions = {
  origin: [
    "http://localhost:3001", // Frontend dev
    "https://yourdomain.com", // Frontend prod
  ],
  credentials: true,
};
```

### Payment Service CORS

```typescript
app.enableCors({
  origin: [
    "http://localhost:3001", // Frontend dev
    "http://backend:3002", // Backend internal
    "https://yourdomain.com", // Frontend prod
  ],
  credentials: true,
});
```

## Health Checks

Each service exposes a health check endpoint:

- Frontend: `GET /` (returns 200 if running)
- Backend: `GET /health`
- Payment Service: `GET /api/v1/health`

## Error Handling

### Service Unavailable

When a service is down, other services should:

1. Log the error
2. Return appropriate HTTP status codes
3. Show user-friendly error messages
4. Implement retry logic where appropriate

### Network Timeouts

Configure appropriate timeouts:

- Frontend → Backend: 30 seconds
- Frontend → Payment: 30 seconds
- Backend → Payment: 10 seconds

## Monitoring

### Logs

Each service logs:

- Incoming requests
- Outgoing requests
- Errors and exceptions
- Performance metrics

### Metrics

Track:

- Request/response times
- Error rates
- Service availability
- Database connection status

## Security

### Internal Communication

- Services communicate over Docker internal network
- No external exposure of internal ports
- Use service names for internal communication

### External Communication

- All external communication over HTTPS in production
- Implement proper authentication
- Validate all inputs
- Use environment variables for sensitive data
