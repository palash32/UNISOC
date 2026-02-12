package main

import (
	"log"
	"os"

	"github.com/cyberflow/backend/internal/api"
	"github.com/cyberflow/backend/internal/config"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize Gin router
	r := gin.Default()

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "cyberflow-backend",
			"version": "0.1.0",
		})
	})

	// Setup API routes
	api.SetupRoutes(r, cfg)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 CyberFlow SOAR Backend starting on port %s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
