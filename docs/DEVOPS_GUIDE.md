# 🥊 Boxing App DevOps Guide

## 📋 Overview

This guide explains how to set up and manage the Boxing App monorepo with 3 services that can communicate seamlessly in both development and production environments.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │ Payment Service │
│   (Next.js)     │◄──►│   (Express.js)  │◄──►│   (NestJS)      │
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

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Make (optional, for easier commands)
- Git

### 1. Clone and Setup

```bash
git clone <your-repo>
cd boxing-app

# Copy environment files
cp env.example env.dev
cp env.example env.prod

# Edit environment variables as needed
nano env.dev
nano env.prod
```

### 2. Development Environment

```bash
# Start development environment
make dev
# or
./scripts/deploy.sh dev

# Check status
make status
make health

# View logs
make dev-logs
```

### 3. Production Environment

```bash
# Setup production (first time only)
make setup-prod

# Start production environment
make prod
# or
./scripts/deploy.sh prod

# Check status
make status
make health
```

## 🛠️ Available Commands

### Development Commands

```bash
make dev          # Start development environment
make dev-logs     # View development logs
make dev-stop     # Stop development environment
```

### Production Commands

```bash
make prod         # Start production environment
make prod-logs    # View production logs
make prod-stop    # Stop production environment
```

### Database Commands

```bash
make db-init      # Initialize databases
make db-reset     # Reset databases
make db-backup    # Backup databases
```

### Utility Commands

```bash
make status       # Check service status
make health       # Check service health
make logs         # View all logs
make clean        # Clean up everything
make build        # Build all images
```

## 🌐 Service URLs

### Development

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3002
- **Payment Service**: http://localhost:3000
- **Database**: localhost:5432

### Production

- **Application**: https://yourdomain.com
- **API**: https://yourdomain.com/api
- **Payment**: https://yourdomain.com/payment

## 🔧 Service Communication

### Frontend → Backend

- **Purpose**: User auth, fight data, stadium info
- **URL**: `http://localhost:3002/api` (dev) / `https://yourdomain.com/api` (prod)

### Frontend → Payment Service

- **Purpose**: Payment processing, booking management
- **URL**: `http://localhost:3000/api/v1` (dev) / `https://yourdomain.com/payment` (prod)

### Backend → Payment Service

- **Purpose**: Payment verification, booking confirmation
- **URL**: `http://payment-service:3000/api/v1` (internal Docker network)

## 📁 Project Structure

```
boxing-app/
├── application/
│   ├── boxing-fight-booking/     # Frontend (Next.js)
│   ├── muay-thai-ticket-backend/ # Backend (Express.js)
│   └── payment-service/          # Payment Service (NestJS)
├── nginx/                        # Nginx configurations
├── scripts/                      # Deployment scripts
├── docker-compose.yml           # Development environment
├── docker-compose.prod.yml      # Production environment
├── env.dev                      # Development environment variables
├── env.prod                     # Production environment variables
└── Makefile                     # Easy command management
```

## 🔐 Environment Variables

### Required for Development

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password

# Service URLs
NEXT_PUBLIC_BACKEND_URL=http://localhost:3002
NEXT_PUBLIC_PAYMENT_SERVICE_URL=http://localhost:3000
```

### Required for Production

```bash
# Database
DB_PASSWORD=your-secure-password

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Omise Payment
OMISE_PUBLIC_KEY=pkey_live_xxxxx
OMISE_SECRET_KEY=skey_live_xxxxx
OMISE_WEBHOOK_SECRET=whsec_xxxxx

# URLs
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_PAYMENT_SERVICE_URL=https://api.yourdomain.com/payment
```

## 🐳 Docker Services

### Development Services

- `postgres` - PostgreSQL database
- `backend` - Express.js backend service
- `payment-service` - NestJS payment service
- `frontend` - Next.js frontend application

### Production Services

- `postgres` - PostgreSQL database with production config
- `backend` - Express.js backend with scaling (2 replicas)
- `payment-service` - NestJS payment service with scaling (3 replicas)
- `frontend` - Next.js frontend with scaling (2 replicas)
- `nginx` - Reverse proxy with SSL termination

## 🔍 Monitoring & Health Checks

### Health Check Endpoints

- Frontend: `GET /` (returns 200 if running)
- Backend: `GET /health`
- Payment Service: `GET /api/v1/health`

### Check Service Health

```bash
make health
```

### View Logs

```bash
# All services
make logs

# Specific environment
make dev-logs
make prod-logs
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Services Not Starting

```bash
# Check Docker status
docker ps

# Check logs
make logs

# Restart services
make dev-stop
make dev
```

#### 2. Database Connection Issues

```bash
# Check database status
docker-compose exec postgres pg_isready -U postgres

# Reset database
make db-reset
make dev
```

#### 3. Port Conflicts

```bash
# Check what's using ports
lsof -i :3000
lsof -i :3001
lsof -i :3002
lsof -i :5432

# Stop conflicting services
sudo kill -9 <PID>
```

#### 4. Environment Variables Not Loading

```bash
# Check environment file
cat .env

# Verify environment file exists
ls -la env.dev env.prod
```

### Clean Up Everything

```bash
make clean
```

## 🔄 Deployment Workflow

### Development Deployment

1. Make code changes
2. Run `make dev` to restart services
3. Test changes
4. Commit and push

### Production Deployment

1. Update environment variables in `env.prod`
2. Run `make prod` to deploy
3. Monitor with `make health`
4. Check logs with `make prod-logs`

### Automated Deployment

```bash
# Deploy with backup
./scripts/deploy.sh prod

# Check deployment status
./scripts/deploy.sh prod status

# Rollback if needed
./scripts/deploy.sh prod rollback
```

## 📊 Performance Optimization

### Development

- Hot reloading enabled
- Volume mounts for live code changes
- Debug logging enabled

### Production

- Multi-stage Docker builds
- Nginx reverse proxy with caching
- Service scaling and load balancing
- Resource limits and health checks
- SSL/TLS termination
- Gzip compression

## 🔒 Security Considerations

### Development

- Test API keys only
- Local database access
- CORS configured for localhost

### Production

- Production API keys
- Secure database credentials
- SSL/TLS encryption
- Rate limiting
- Security headers
- Input validation
- Environment variable protection

## 📝 Best Practices

1. **Always use environment variables** for configuration
2. **Test in development** before deploying to production
3. **Monitor service health** regularly
4. **Backup databases** before major deployments
5. **Use version control** for all configuration changes
6. **Document any custom configurations**
7. **Keep dependencies updated**
8. **Monitor logs** for errors and performance issues

## 🆘 Support

If you encounter issues:

1. Check the logs: `make logs`
2. Verify environment variables
3. Check service health: `make health`
4. Review this guide
5. Check the service communication documentation: `scripts/service-communication.md`

---

**Happy Coding! 🥊**
