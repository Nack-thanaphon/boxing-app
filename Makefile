# ===========================================
# BOXING APP DEVOPS MAKEFILE
# ===========================================

.PHONY: help all dev prod deploy database-init database-reset stop clean logs build status health check-env setup-dev setup-prod

# Default target
all: help

# Help target
help:
	@echo "==========================================="
	@echo "BOXING APP DEVOPS COMMANDS"
	@echo "==========================================="
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-logs     - View development logs"
	@echo "  make dev-stop     - Stop development environment"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-logs    - View production logs"
	@echo "  make prod-stop    - Stop production environment"
	@echo ""
	@echo "Database:"
	@echo "  make db-init      - Initialize databases"
	@echo "  make db-reset     - Reset databases"
	@echo "  make db-backup    - Backup databases"
	@echo ""
	@echo "Utilities:"
	@echo "  make status       - Check service status"
	@echo "  make health       - Check service health"
	@echo "  make logs         - View all logs"
	@echo "  make clean        - Clean up everything"
	@echo "  make build        - Build all images"
	@echo ""
	@echo "Setup:"
	@echo "  make setup-dev    - Setup development environment"
	@echo "  make setup-prod   - Setup production environment"
	@echo "==========================================="

# ===========================================
# DEVELOPMENT COMMANDS
# ===========================================

dev: check-env-dev
	@echo "🚀 Starting development environment..."
	@cp env.dev .env
	docker-compose -f docker-compose.yml up --build -d
	@echo "✅ Development services are running!"
	@echo "🌐 Frontend: http://localhost:3001"
	@echo "🔧 Backend API: http://localhost:3002"
	@echo "💳 Payment Service: http://localhost:3000"
	@echo "🗄️  Database: localhost:5432"

dev-logs:
	@echo "📋 Viewing development logs..."
	docker-compose -f docker-compose.yml logs -f

dev-stop:
	@echo "🛑 Stopping development environment..."
	docker-compose -f docker-compose.yml down

# ===========================================
# PRODUCTION COMMANDS
# ===========================================

prod: check-env-prod
	@echo "🚀 Starting production environment..."
	@cp env.prod .env
	docker-compose -f docker-compose.prod.yml up --build -d
	@echo "✅ Production services are running!"
	@echo "🌐 Application: https://yourdomain.com"
	@echo "🔧 API: https://yourdomain.com/api"
	@echo "💳 Payment: https://yourdomain.com/payment"

prod-logs:
	@echo "📋 Viewing production logs..."
	docker-compose -f docker-compose.prod.yml logs -f

prod-stop:
	@echo "🛑 Stopping production environment..."
	docker-compose -f docker-compose.prod.yml down

# ===========================================
# DATABASE COMMANDS
# ===========================================

db-init:
	@echo "🗄️  Initializing databases..."
	docker-compose -f docker-compose.yml exec postgres psql -U postgres -f /docker-entrypoint-initdb.d/init-databases.sql
	@echo "✅ Database initialization complete!"

db-reset:
	@echo "🗄️  Resetting databases..."
	docker-compose -f docker-compose.yml down -v
	@echo "✅ Database reset complete!"

db-backup:
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	docker-compose -f docker-compose.yml exec postgres pg_dump -U postgres boxing_app_dev > backups/boxing_app_dev_$(shell date +%Y%m%d_%H%M%S).sql
	docker-compose -f docker-compose.yml exec postgres pg_dump -U postgres payment_service_dev > backups/payment_service_dev_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backup complete!"

# ===========================================
# UTILITY COMMANDS
# ===========================================

status:
	@echo "📊 Service Status:"
	@echo "==========================================="
	@docker-compose -f docker-compose.yml ps

health:
	@echo "🏥 Health Check:"
	@echo "==========================================="
	@echo "Frontend: $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001 || echo 'DOWN')"
	@echo "Backend: $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3002/health || echo 'DOWN')"
	@echo "Payment: $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/v1/health || echo 'DOWN')"

logs:
	@echo "📋 Viewing all service logs..."
	docker-compose -f docker-compose.yml logs -f

clean:
	@echo "🧹 Cleaning up everything..."
	docker-compose -f docker-compose.yml down -v --rmi all --remove-orphans
	docker-compose -f docker-compose.prod.yml down -v --rmi all --remove-orphans
	docker volume prune -f
	docker image prune -f
	@echo "✅ Cleanup complete!"

build:
	@echo "🔨 Building all service images..."
	docker-compose -f docker-compose.yml build --no-cache
	@echo "✅ Build complete!"

# ===========================================
# SETUP COMMANDS
# ===========================================

setup-dev: check-env-dev
	@echo "⚙️  Setting up development environment..."
	@cp env.dev .env
	@mkdir -p logs/backend logs/payment
	@echo "✅ Development environment setup complete!"

setup-prod: check-env-prod
	@echo "⚙️  Setting up production environment..."
	@cp env.prod .env
	@mkdir -p logs/backend logs/payment nginx/ssl
	@echo "⚠️  Remember to:"
	@echo "   1. Update environment variables in .env"
	@echo "   2. Add SSL certificates to nginx/ssl/"
	@echo "   3. Update domain names in nginx/nginx.prod.conf"
	@echo "✅ Production environment setup complete!"

# ===========================================
# ENVIRONMENT CHECKS
# ===========================================

check-env-dev:
	@if [ ! -f env.dev ]; then \
		echo "❌ env.dev file not found!"; \
		echo "Please create env.dev file from env.example"; \
		exit 1; \
	fi

check-env-prod:
	@if [ ! -f env.prod ]; then \
		echo "❌ env.prod file not found!"; \
		echo "Please create env.prod file from env.example"; \
		exit 1; \
	fi