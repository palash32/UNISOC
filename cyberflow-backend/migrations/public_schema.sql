-- CyberFlow SOAR Platform - Public Schema
-- This schema contains shared metadata across all tenants

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table - tenant registry
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_org_id VARCHAR(255) UNIQUE NOT NULL, -- Clerk organization ID
    schema_name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'org_abc123'
    name VARCHAR(200) NOT NULL,
    tier VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    max_alerts_per_month INT DEFAULT 1000,
    max_users INT DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_clerk_org_id ON organizations(clerk_org_id);
CREATE INDEX idx_organizations_schema_name ON organizations(schema_name);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- Schema migrations tracking (across all tenant schemas)
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    schema_name VARCHAR(100) NOT NULL, -- Which tenant schema
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(version, schema_name)
);

CREATE INDEX idx_schema_migrations_schema_name ON schema_migrations(schema_name);

-- Users table (optional - can also use Clerk directly)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'analyst', -- 'admin', 'analyst', 'viewer'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_org_id ON users(org_id);
