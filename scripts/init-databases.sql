-- ===========================================
-- DATABASE INITIALIZATION SCRIPT (DEVELOPMENT)
-- ===========================================

-- Create databases for development
CREATE DATABASE boxing_app_dev;
CREATE DATABASE payment_service_dev;

-- Create user for development (optional)
-- CREATE USER dev_user WITH PASSWORD 'dev_password';
-- GRANT ALL PRIVILEGES ON DATABASE boxing_app_dev TO dev_user;
-- GRANT ALL PRIVILEGES ON DATABASE payment_service_dev TO dev_user;

-- Connect to boxing_app_dev database
\c boxing_app_dev;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Connect to payment_service_dev database
\c payment_service_dev;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log completion
\echo 'Development databases created successfully!'
