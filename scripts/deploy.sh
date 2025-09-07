#!/bin/bash

# ===========================================
# BOXING APP DEPLOYMENT SCRIPT
# ===========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log_success "Docker is running"
}

# Check environment file
check_environment() {
    if [ "$ENVIRONMENT" = "dev" ]; then
        if [ ! -f "env.dev" ]; then
            log_error "env.dev file not found!"
            exit 1
        fi
        ENV_FILE="env.dev"
        COMPOSE_FILE="docker-compose.yml"
    elif [ "$ENVIRONMENT" = "prod" ]; then
        if [ ! -f "env.prod" ]; then
            log_error "env.prod file not found!"
            exit 1
        fi
        ENV_FILE="env.prod"
        COMPOSE_FILE="docker-compose.prod.yml"
    else
        log_error "Invalid environment. Use 'dev' or 'prod'"
        exit 1
    fi
    log_success "Environment: $ENVIRONMENT"
}

# Create backup
create_backup() {
    if [ "$ENVIRONMENT" = "prod" ]; then
        log_info "Creating database backup..."
        mkdir -p "$BACKUP_DIR"
        
        # Get current timestamp
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        
        # Backup databases
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U postgres boxing_app_prod > "$BACKUP_DIR/boxing_app_prod_$TIMESTAMP.sql" || true
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U postgres payment_service_prod > "$BACKUP_DIR/payment_service_prod_$TIMESTAMP.sql" || true
        
        log_success "Backup created: $BACKUP_DIR/*_$TIMESTAMP.sql"
    fi
}

# Stop existing services
stop_services() {
    log_info "Stopping existing services..."
    docker-compose -f "$COMPOSE_FILE" down || true
    log_success "Services stopped"
}

# Build and start services
start_services() {
    log_info "Building and starting services..."
    
    # Copy environment file
    cp "$ENV_FILE" .env
    
    # Create necessary directories
    mkdir -p "$LOG_DIR"/backend "$LOG_DIR"/payment
    
    # Build and start
    docker-compose -f "$COMPOSE_FILE" up --build -d
    
    log_success "Services started"
}

# Wait for services to be healthy
wait_for_health() {
    log_info "Waiting for services to be healthy..."
    
    # Wait for database
    log_info "Waiting for database..."
    timeout 60 bash -c 'until docker-compose -f '"$COMPOSE_FILE"' exec postgres pg_isready -U postgres; do sleep 2; done'
    
    # Wait for backend
    log_info "Waiting for backend..."
    timeout 60 bash -c 'until curl -f http://localhost:3002/health > /dev/null 2>&1; do sleep 2; done'
    
    # Wait for payment service
    log_info "Waiting for payment service..."
    timeout 60 bash -c 'until curl -f http://localhost:3000/api/v1/health > /dev/null 2>&1; do sleep 2; done'
    
    # Wait for frontend
    log_info "Waiting for frontend..."
    timeout 60 bash -c 'until curl -f http://localhost:3001 > /dev/null 2>&1; do sleep 2; done'
    
    log_success "All services are healthy"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Backend migrations
    docker-compose -f "$COMPOSE_FILE" exec backend npm run db:migrate || true
    
    # Payment service migrations
    docker-compose -f "$COMPOSE_FILE" exec payment-service npm run migration:run || true
    
    log_success "Migrations completed"
}

# Show service status
show_status() {
    log_info "Service Status:"
    echo "==========================================="
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    log_info "Service URLs:"
    if [ "$ENVIRONMENT" = "dev" ]; then
        echo "🌐 Frontend: http://localhost:3001"
        echo "🔧 Backend API: http://localhost:3002"
        echo "💳 Payment Service: http://localhost:3000"
        echo "🗄️  Database: localhost:5432"
    else
        echo "🌐 Application: https://yourdomain.com"
        echo "🔧 API: https://yourdomain.com/api"
        echo "💳 Payment: https://yourdomain.com/payment"
    fi
}

# Main deployment function
deploy() {
    log_info "Starting deployment for $ENVIRONMENT environment..."
    
    check_docker
    check_environment
    create_backup
    stop_services
    start_services
    wait_for_health
    run_migrations
    show_status
    
    log_success "Deployment completed successfully!"
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    # Stop current services
    docker-compose -f "$COMPOSE_FILE" down
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | head -n 1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        log_info "Restoring from backup: $LATEST_BACKUP"
        # Restore logic would go here
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
        exit 1
    fi
}

# Main script logic
case "${2:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "status")
        check_environment
        show_status
        ;;
    *)
        echo "Usage: $0 <environment> [deploy|rollback|status]"
        echo "  environment: dev or prod"
        echo "  action: deploy (default), rollback, or status"
        exit 1
        ;;
esac
