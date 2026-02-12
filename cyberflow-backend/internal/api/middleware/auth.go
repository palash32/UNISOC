package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// ClerkAuth middleware validates Clerk JWT tokens and extracts organization info
func ClerkAuth(secretKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization header"})
			c.Abort()
			return
		}

		// Remove "Bearer " prefix
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		// TODO: Implement actual Clerk JWT verification
		// For MVP, we'll add a placeholder
		// In production, use Clerk's Go SDK or verify JWT manually

		// Extract org_id from custom header (set by Next.js middleware)
		orgID := c.GetHeader("X-Organization-ID")
		if orgID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing organization context"})
			c.Abort()
			return
		}

		// Store org_id in context for use in handlers
		ctx := context.WithValue(c.Request.Context(), "org_id", orgID)
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}

// GetOrgID retrieves the organization ID from the request context
func GetOrgID(c *gin.Context) string {
	orgID, _ := c.Request.Context().Value("org_id").(string)
	return orgID
}
