package handlers

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// LookupHandlers holds threat intel API keys
type LookupHandlers struct {
	VirusTotalKey string
	AbuseIPDBKey  string
	ShodanKey     string
	httpClient    *http.Client
}

// NewLookupHandlers creates a new lookup handler set
func NewLookupHandlers(vtKey, abuseKey, shodanKey string) *LookupHandlers {
	return &LookupHandlers{
		VirusTotalKey: vtKey,
		AbuseIPDBKey:  abuseKey,
		ShodanKey:     shodanKey,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// --- VirusTotal Proxy ---

// VTLookupIP proxies VirusTotal IP lookup
func (h *LookupHandlers) VTLookupIP(c *gin.Context) {
	ip := c.Param("indicator")
	if ip == "" {
		c.JSON(400, gin.H{"error": "IP address required"})
		return
	}

	if h.VirusTotalKey == "" {
		c.JSON(503, gin.H{"error": "VirusTotal API key not configured"})
		return
	}

	data, err := h.vtRequest(fmt.Sprintf("https://www.virustotal.com/api/v3/ip_addresses/%s", ip))
	if err != nil {
		c.JSON(502, gin.H{"error": err.Error()})
		return
	}
	c.Data(200, "application/json", data)
}

// VTLookupDomain proxies VirusTotal domain lookup
func (h *LookupHandlers) VTLookupDomain(c *gin.Context) {
	domain := c.Param("indicator")
	if domain == "" {
		c.JSON(400, gin.H{"error": "Domain required"})
		return
	}

	if h.VirusTotalKey == "" {
		c.JSON(503, gin.H{"error": "VirusTotal API key not configured"})
		return
	}

	data, err := h.vtRequest(fmt.Sprintf("https://www.virustotal.com/api/v3/domains/%s", domain))
	if err != nil {
		c.JSON(502, gin.H{"error": err.Error()})
		return
	}
	c.Data(200, "application/json", data)
}

// VTLookupHash proxies VirusTotal file hash lookup
func (h *LookupHandlers) VTLookupHash(c *gin.Context) {
	hash := c.Param("indicator")
	if hash == "" {
		c.JSON(400, gin.H{"error": "Hash required"})
		return
	}

	if h.VirusTotalKey == "" {
		c.JSON(503, gin.H{"error": "VirusTotal API key not configured"})
		return
	}

	data, err := h.vtRequest(fmt.Sprintf("https://www.virustotal.com/api/v3/files/%s", hash))
	if err != nil {
		c.JSON(502, gin.H{"error": err.Error()})
		return
	}
	c.Data(200, "application/json", data)
}

// VTLookupURL proxies VirusTotal URL lookup
func (h *LookupHandlers) VTLookupURL(c *gin.Context) {
	url := c.Query("url")
	if url == "" {
		c.JSON(400, gin.H{"error": "URL query parameter required"})
		return
	}

	if h.VirusTotalKey == "" {
		c.JSON(503, gin.H{"error": "VirusTotal API key not configured"})
		return
	}

	// VT encodes URLs as base64(url) without padding
	encoded := strings.TrimRight(
		strings.NewReplacer("+", "-", "/", "_").Replace(
			fmt.Sprintf("%s", url),
		), "=",
	)

	// For URL lookups, first submit the URL then retrieve the analysis
	// Using the URL identifier endpoint
	data, err := h.vtRequest(fmt.Sprintf("https://www.virustotal.com/api/v3/urls/%s", encoded))
	if err != nil {
		c.JSON(502, gin.H{"error": err.Error()})
		return
	}
	c.Data(200, "application/json", data)
}

func (h *LookupHandlers) vtRequest(url string) ([]byte, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("x-apikey", h.VirusTotalKey)
	req.Header.Set("Accept", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("VirusTotal returned status %d: %s", resp.StatusCode, string(body))
	}

	return body, nil
}

// --- AbuseIPDB Proxy ---

// AbuseIPDBCheck proxies AbuseIPDB IP check
func (h *LookupHandlers) AbuseIPDBCheck(c *gin.Context) {
	ip := c.Param("indicator")
	if ip == "" {
		c.JSON(400, gin.H{"error": "IP address required"})
		return
	}

	if h.AbuseIPDBKey == "" {
		c.JSON(503, gin.H{"error": "AbuseIPDB API key not configured"})
		return
	}

	url := fmt.Sprintf("https://api.abuseipdb.com/api/v2/check?ipAddress=%s&maxAgeInDays=90&verbose=true", ip)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	req.Header.Set("Key", h.AbuseIPDBKey)
	req.Header.Set("Accept", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		c.JSON(502, gin.H{"error": "AbuseIPDB request failed"})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to read response"})
		return
	}

	c.Data(resp.StatusCode, "application/json", body)
}

// --- Shodan Proxy ---

// ShodanHost proxies Shodan host lookup
func (h *LookupHandlers) ShodanHost(c *gin.Context) {
	ip := c.Param("indicator")
	if ip == "" {
		c.JSON(400, gin.H{"error": "IP address required"})
		return
	}

	if h.ShodanKey == "" {
		c.JSON(503, gin.H{"error": "Shodan API key not configured"})
		return
	}

	url := fmt.Sprintf("https://api.shodan.io/shodan/host/%s?key=%s", ip, h.ShodanKey)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.httpClient.Do(req)
	if err != nil {
		c.JSON(502, gin.H{"error": "Shodan request failed"})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to read response"})
		return
	}

	c.Data(resp.StatusCode, "application/json", body)
}

// --- API Status ---

// APIStatus returns which threat intel APIs are configured
func (h *LookupHandlers) APIStatus(c *gin.Context) {
	c.JSON(200, gin.H{
		"virustotal": h.VirusTotalKey != "",
		"abuseipdb":  h.AbuseIPDBKey != "",
		"shodan":     h.ShodanKey != "",
	})
}
