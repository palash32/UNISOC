package api

import (
	"github.com/cyberflow/backend/internal/api/handlers"
	"github.com/cyberflow/backend/internal/api/middleware"
	"github.com/cyberflow/backend/internal/config"
	"github.com/gin-gonic/gin"
)

// SetupRoutes configures all API routes
func SetupRoutes(r *gin.Engine, cfg *config.Config) {
	// CORS middleware for Next.js frontend
	r.Use(middleware.CORS())

	// Create lookup handlers with API keys
	lookups := handlers.NewLookupHandlers(
		cfg.VirusTotalAPIKey,
		cfg.AbuseIPDBAPIKey,
		cfg.ShodanAPIKey,
	)

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Public webhook endpoints (no auth)
		webhooks := v1.Group("/webhooks")
		{
			webhooks.POST("/ingest", handlers.IngestAlert)
		}

		// Public stats (real-time usage counter, no auth)
		stats := v1.Group("/public/stats")
		{
			stats.GET("", handlers.GetStats)
			stats.POST("/scan", handlers.IncrementScan)
			stats.POST("/report", handlers.IncrementReport)
			stats.POST("/user", handlers.IncrementUser)
		}

		// --- SOC Toolkit Lookup Routes (public for now, auth added later) ---
		lookup := v1.Group("/lookup")
		{
			// API status — which threat intel services are configured
			lookup.GET("/status", lookups.APIStatus)

			// VirusTotal
			vt := lookup.Group("/vt")
			{
				vt.GET("/ip/:indicator", lookups.VTLookupIP)
				vt.GET("/domain/:indicator", lookups.VTLookupDomain)
				vt.GET("/hash/:indicator", lookups.VTLookupHash)
				vt.GET("/url", lookups.VTLookupURL)
			}

			// AbuseIPDB
			lookup.GET("/abuseipdb/:indicator", lookups.AbuseIPDBCheck)

			// Shodan
			lookup.GET("/shodan/:indicator", lookups.ShodanHost)
		}

		// Protected routes (require Clerk authentication — disabled for now)
		protected := v1.Group("")
		protected.Use(middleware.ClerkAuth(cfg.ClerkSecretKey))
		{
			// Alerts
			alerts := protected.Group("/alerts")
			{
				alerts.GET("", handlers.ListAlerts)
				alerts.GET("/:id", handlers.GetAlert)
			}

			// Incidents
			incidents := protected.Group("/incidents")
			{
				incidents.GET("", handlers.ListIncidents)
				incidents.GET("/:id", handlers.GetIncident)
				incidents.POST("", handlers.CreateIncident)
				incidents.PATCH("/:id", handlers.UpdateIncident)
			}

			// Playbooks
			playbooks := protected.Group("/playbooks")
			{
				playbooks.GET("", handlers.ListPlaybooks)
				playbooks.GET("/:id", handlers.GetPlaybook)
				playbooks.POST("", handlers.CreatePlaybook)
				playbooks.PUT("/:id", handlers.UpdatePlaybook)
				playbooks.DELETE("/:id", handlers.DeletePlaybook)
				playbooks.POST("/:id/execute", handlers.ExecutePlaybook)
			}

			// Integrations
			integrations := protected.Group("/integrations")
			{
				integrations.GET("", handlers.ListIntegrations)
				integrations.POST("", handlers.CreateIntegration)
				integrations.PUT("/:id", handlers.UpdateIntegration)
				integrations.DELETE("/:id", handlers.DeleteIntegration)
			}

			// Organizations (admin only)
			orgs := protected.Group("/organizations")
			{
				orgs.GET("", handlers.ListOrganizations)
				orgs.POST("", handlers.CreateOrganization)
			}
		}
	}
}
