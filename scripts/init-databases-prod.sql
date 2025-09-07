-- ===========================================
-- DATABASE INITIALIZATION SCRIPT (PRODUCTION)
-- ===========================================

-- Create databases for production
CREATE DATABASE boxing_app_prod;
CREATE DATABASE payment_service_prod;

-- Create production user with limited privileges
CREATE USER prod_user WITH PASSWORD 'prod_secure_password';
GRANT CONNECT ON DATABASE boxing_app_prod TO prod_user;
GRANT CONNECT ON DATABASE payment_service_prod TO prod_user;

-- Connect to boxing_app_prod database
\c boxing_app_prod;

-- Grant schema privileges
GRANT USAGE ON SCHEMA public TO prod_user;
GRANT CREATE ON SCHEMA public TO prod_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO prod_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO prod_user;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Connect to payment_service_prod database
\c payment_service_prod;

-- Grant schema privileges
GRANT USAGE ON SCHEMA public TO prod_user;
GRANT CREATE ON SCHEMA public TO prod_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO prod_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO prod_user;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log completion
\echo 'Production databases created successfully!'
