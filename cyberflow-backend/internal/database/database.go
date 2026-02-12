package database

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var dbPool *pgxpool.Pool

// Initialize creates the database connection pool
func Initialize(databaseURL string) error {
	var err error
	dbPool, err = pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		return fmt.Errorf("unable to create connection pool: %w", err)
	}

	// Test the connection
	if err := dbPool.Ping(context.Background()); err != nil {
		return fmt.Errorf("unable to ping database: %w", err)
	}

	log.Println("✅ Database connection pool established")
	return nil
}

// GetPool returns the database connection pool
func GetPool() *pgxpool.Pool {
	return dbPool
}

// Close closes the database connection pool
func Close() {
	if dbPool != nil {
		dbPool.Close()
		log.Println("Database connection pool closed")
	}
}

// SetSearchPath sets the PostgreSQL search_path for tenant isolation
func SetSearchPath(ctx context.Context, orgID string) error {
	schemaName := fmt.Sprintf("org_%s", orgID)
	query := fmt.Sprintf("SET search_path TO %s, public", schemaName)

	_, err := dbPool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to set search_path: %w", err)
	}

	return nil
}

// CreateTenantSchema creates a new schema for an organization
func CreateTenantSchema(ctx context.Context, orgID string) error {
	schemaName := fmt.Sprintf("org_%s", orgID)

	// Create schema
	createSchemaSQL := fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", schemaName)
	if _, err := dbPool.Exec(ctx, createSchemaSQL); err != nil {
		return fmt.Errorf("failed to create schema: %w", err)
	}

	// Apply tenant schema migration
	migrationSQL, err := os.ReadFile("migrations/tenant_schema.sql")
	if err != nil {
		return fmt.Errorf("failed to read migration file: %w", err)
	}

	// Set search path and execute migration
	if err := SetSearchPath(ctx, orgID); err != nil {
		return err
	}

	if _, err := dbPool.Exec(ctx, string(migrationSQL)); err != nil {
		return fmt.Errorf("failed to apply migration: %w", err)
	}

	log.Printf("✅ Created schema for organization: %s", orgID)
	return nil
}
