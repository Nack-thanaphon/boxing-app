# Payment & Reservation Service

A comprehensive NestJS backend service for handling payments and seat reservations with Omise payment integration, queue management, and structured logging.

## 🎯 Features

- **Payment Processing** - Support for card, QR code, bank transfer, and WeChat Pay via Omise
- **Seat Management** - Reserve, cancel, and track seat availability
- **Webhook Handling** - Real-time payment status updates from Omise
- **Queue System** - Asynchronous logging with BullMQ and Redis
- **Structured Logging** - Winston logger with database storage
- **Health Monitoring** - Health check endpoints
- **Docker Support** - Complete containerization with PostgreSQL, Redis, and Nginx

## 🛠 Tech Stack

- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL with TypeORM
- **Queue**: Redis + BullMQ
- **Payments**: Omise SDK
- **Logging**: Winston + Database storage
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx

## 📂 Project Structure

```
src/
├── common/
│   └── logger/              # Winston logger service
├── payments/                # Payment processing
├── seats/                   # Seat management
├── webhook/                 # Omise webhook handling
├── queue/                   # BullMQ queue processing
├── database/
│   ├── entities/           # TypeORM entities
│   └── migrations/         # Database migrations
├── app.module.ts
└── main.ts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Omise account (for payment processing)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd payment-service
cp env.example .env
```

### 2. Configure Environment

Edit `.env` file with your settings:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=payment_service

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Omise
OMISE_PUBLIC_KEY=pkey_test_xxxxxxxxxxxxxxxxxxxxx
OMISE_SECRET_KEY=skey_test_xxxxxxxxxxxxxxxxxxxxx
OMISE_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxxxxxxxxxxx
```

### 3. Run with Docker

```bash
# Start all services
docker-compose up -d

# Check service health
curl http://localhost/health
```

### 4. Development Setup

```bash
# Install dependencies
npm install

# Start PostgreSQL and Redis
docker-compose up postgres redis -d

# Run in development mode
npm run start:dev
```

## 📋 API Endpoints

### Health Check
- `GET /api/v1/health` - Service health status

### Seat Management
- `GET /api/v1/seats` - List all seats
- `GET /api/v1/seats/available` - List available seats
- `GET /api/v1/seats/:id` - Get seat by ID
- `POST /api/v1/seats` - Create new seat
- `POST /api/v1/seats/reserve` - Reserve a seat
- `POST /api/v1/seats/:id/cancel` - Cancel reservation
- `POST /api/v1/seats/release-expired` - Release expired reservations

### Payments
- `POST /api/v1/payments/create` - Create payment
- `GET /api/v1/payments/:id` - Get payment by ID
- `GET /api/v1/payments` - List payments (with pagination)

### Webhooks
- `POST /api/payment/webhook` - Omise webhook endpoint
- `POST /api/payment/webhook/test` - Test webhook endpoint

## 💳 Payment Methods

### Card Payment
```json
{
  \"amount\": 1500.00,
  \"currency\": \"THB\",
  \"payment_method\": \"card\",
  \"seat_id\": \"seat-uuid\",
  \"customer_email\": \"customer@example.com\",
  \"customer_name\": \"John Doe\"
}
```

### QR Code Payment
```json
{
  \"amount\": 800.00,
  \"currency\": \"THB\",
  \"payment_method\": \"qr_code\",
  \"seat_id\": \"seat-uuid\",
  \"customer_email\": \"customer@example.com\"
}
```

### Bank Transfer
```json
{
  \"amount\": 1200.00,
  \"currency\": \"THB\",
  \"payment_method\": \"bank_transfer\",
  \"seat_id\": \"seat-uuid\",
  \"customer_email\": \"customer@example.com\"
}
```

## 🔔 Webhook Events

The service handles these Omise webhook events:

- `charge.complete` - Payment successful
- `charge.failed` - Payment failed
- `charge.pending` - Payment pending
- `charge.reversed` - Payment reversed/refunded

## 📊 Database Schema

### Payments Table
- Payment records with Omise charge IDs
- Status tracking (pending, paid, failed, cancelled)
- Customer and seat associations

### Seats Table
- Seat inventory with pricing
- Reservation status and timing
- Flexible metadata support

### Payment Logs Table
- Structured logging of all payment events
- Request/response tracking
- Error monitoring

## 🔧 Development

### Scripts
```bash
npm run start:dev    # Development mode
npm run build        # Build for production
npm run start:prod   # Production mode
npm run test         # Run tests
npm run lint         # Code linting
```

### Database Operations
```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## 🐳 Docker Services

### Services Overview
- **payment-service**: Main NestJS application
- **postgres**: PostgreSQL database
- **redis**: Redis for queue management
- **nginx**: Reverse proxy

### Service Ports
- **Application**: 3000
- **Nginx**: 80, 443
- **PostgreSQL**: 5432
- **Redis**: 6379

## 📝 Logging

All payment operations are logged with:
- Structured JSON format
- Database persistence
- Request/response tracking
- Error context capture

Logs are stored in:
- Database: `payment_logs` table
- Files: `logs/` directory

## 🧪 Testing

Import the Postman collection (`postman-collection.json`) for API testing:

1. Import collection into Postman
2. Set `baseUrl` variable to your service URL
3. Test all endpoints with sample data

## 🔒 Security

- CORS configuration
- Request validation
- Webhook signature verification
- SQL injection prevention via TypeORM
- Environment variable protection

## 📈 Monitoring

- Health check endpoints
- Structured logging
- Queue job monitoring
- Database connection health

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   docker-compose ps postgres
   
   # View database logs
   docker-compose logs postgres
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis status
   docker-compose ps redis
   
   # Test Redis connection
   docker-compose exec redis redis-cli ping
   ```

3. **Omise API Errors**
   - Verify API keys in `.env`
   - Check Omise dashboard for account status
   - Ensure webhook URL is configured in Omise

4. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :3000
   
   # Kill process
   kill -9 <PID>
   ```

### Logs Location
- Application logs: `logs/` directory
- Database logs: Docker container logs
- Nginx logs: `/var/log/nginx/` in container

For more help, check the [GitHub Issues](link-to-issues) or contact the development team.
