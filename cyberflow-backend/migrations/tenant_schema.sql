-- CyberFlow SOAR Platform - PostgreSQL Schema Migration
-- This file creates the baseline schema structure for a single tenant

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alerts table - ingested security alerts
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255),
    source VARCHAR(100) NOT NULL, -- e.g., 'aws-guardduty', 'crowdstrike'
    severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low', 'info'
    title VARCHAR(500) NOT NULL,
    description TEXT,
    raw_data JSONB NOT NULL, -- Original alert payload
    normalized_data JSONB, -- Mapped to internal schema
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'processed', 'correlated'
    incident_id UUID, -- Link to incident if correlated
    fingerprint VARCHAR(255), -- For deduplication
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(external_id, source) -- Prevent duplicates from same source
);

CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_incident_id ON alerts(incident_id);
CREATE INDEX idx_alerts_fingerprint ON alerts(fingerprint);

-- Incidents table - correlated security incidents
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    assigned_to VARCHAR(255), -- User ID from Clerk
    alert_count INT DEFAULT 0,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to);

-- Playbooks table - workflow definitions
CREATE TABLE IF NOT EXISTS playbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    trigger_conditions JSONB NOT NULL, -- Conditions to trigger playbook
    workflow_definition JSONB NOT NULL, -- Node graph structure
    created_by VARCHAR(255) NOT NULL, -- User ID from Clerk
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_playbooks_is_active ON playbooks(is_active);
CREATE INDEX idx_playbooks_created_at ON playbooks(created_at DESC);

-- Playbook Runs table - execution history
CREATE TABLE IF NOT EXISTS playbook_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'running', -- 'running', 'completed', 'failed', 'paused'
    current_node VARCHAR(100),
    execution_state JSONB, -- Checkpoint data for idempotent retries
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_playbook_runs_playbook_id ON playbook_runs(playbook_id);
CREATE INDEX idx_playbook_runs_status ON playbook_runs(status);
CREATE INDEX idx_playbook_runs_started_at ON playbook_runs(started_at DESC);

-- Integrations table - third-party tool configurations
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'aws-guardduty', 'virustotal', 'slack', etc.
    config JSONB NOT NULL, -- API keys, endpoints, field mappings
    is_enabled BOOLEAN DEFAULT true,
    api_key VARCHAR(255) UNIQUE, -- For webhook authentication
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_is_enabled ON integrations(is_enabled);
CREATE INDEX idx_integrations_api_key ON integrations(api_key);

-- Evidence table - attached files for incidents
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    storage_url VARCHAR(1000) NOT NULL,
    uploaded_by VARCHAR(255) NOT NULL, -- User ID from Clerk
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_evidence_incident_id ON evidence(incident_id);
CREATE INDEX idx_evidence_created_at ON evidence(created_at DESC);

-- Audit Log table - comprehensive activity tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'alert', 'incident', 'playbook', etc.
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'deleted', 'executed'
    actor_type VARCHAR(50) NOT NULL, -- 'user', 'system', 'playbook'
    actor_id VARCHAR(255) NOT NULL,
    changes JSONB, -- Before/after data
    metadata JSONB, -- Additional context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_type, actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbooks_updated_at BEFORE UPDATE ON playbooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
