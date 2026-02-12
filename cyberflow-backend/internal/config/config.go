package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	DatabaseURL    string
	RedisURL       string
	ClerkSecretKey string
	Environment    string

	// Threat Intel API Keys
	VirusTotalAPIKey string
	AbuseIPDBAPIKey  string
	ShodanAPIKey     string

	// Frontend URL for CORS
	FrontendURL string
}

// Load reads configuration from environment variables
func Load() *Config {
	// Load .env file if it exists (development)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://localhost:5432/cyberflow?sslmode=disable"),
		RedisURL:       getEnv("REDIS_URL", "localhost:6379"),
		ClerkSecretKey: getEnv("CLERK_SECRET_KEY", ""),
		Environment:    getEnv("ENVIRONMENT", "development"),

		// Threat Intel
		VirusTotalAPIKey: getEnv("VIRUSTOTAL_API_KEY", ""),
		AbuseIPDBAPIKey:  getEnv("ABUSEIPDB_API_KEY", ""),
		ShodanAPIKey:     getEnv("SHODAN_API_KEY", ""),

		// Frontend
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
