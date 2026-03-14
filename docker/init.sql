-- Mirsklada Database Initialization Script
-- This runs automatically when the PostgreSQL container is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption functions (optional)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mirsklada TO postgres;

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE '✅ Mirsklada database initialized successfully!';
END $$;
