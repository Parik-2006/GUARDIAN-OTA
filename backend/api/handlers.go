// Package api implements all HTTP route handlers for the GUARDIAN-OTA backend.
// Each handler is a thin adapter — business logic lives in campaign/twin/events packages.
package api

import (
	"context"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"sdv-ota/backend/campaign"
	"sdv-ota/backend/events"
	mqttclient "sdv-ota/backend/mqtt"
	"sdv-ota/backend/twin"
	"sdv-ota/backend/ws"
)

// Deps aggregates all service dependencies required by the handlers.
type Deps struct {
	Registry  *twin.Registry
	Campaigns *campaign.Manager
	Events    *events.Store
	Hub       *ws.Hub
	Publisher *mqttclient.Publisher
}

// OTADeployRequest is the JSON body accepted by POST /api/ota/deploy.
type OTADeployRequest struct {
	Version       string `json:"version"       binding:"required"`
	FirmwareURL   string `json:"firmwareUrl"   binding:"required"`
	FirmwareHash  string `json:"firmwareHash"  binding:"required"`
	SignatureB64  string `json:"signatureB64"  binding:"required"`
	CanaryPercent int    `json:"canaryPercent"`
}

// RegisterRoutes wires all routes onto the given Gin engine.
func RegisterRoutes(r *gin.Engine, d *Deps) {
	r.GET("/health", handleHealth)
	r.GET("/api/fleet", d.handleFleet)
	r.POST("/api/ota/deploy", d.handleDeploy)
	r.GET("/api/campaigns", d.handleCampaigns)
	r.GET("/api/campaigns/:id", d.handleCampaign)
	r.GET("/api/events", d.handleEvents)
	r.GET("/ws/events", gin.WrapF(d.Hub.ServeHTTP))
}

func handleHealth(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"ok": true, "ts": time.Now().UTC()})
}

func (d *Deps) handleFleet(c *gin.Context) {
	devices := d.Registry.Snapshot()
	c.JSON(http.StatusOK, gin.H{"devices": devices, "count": len(devices)})
}

func (d *Deps) handleDeploy(c *gin.Context) {
	var req OTADeployRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.CanaryPercent < 1 || req.CanaryPercent > 100 {
		req.CanaryPercent = 10 // default to 10% canary
	}

	// Create campaign
	cmp, err := d.Campaigns.Create(req.Version, req.FirmwareURL, req.FirmwareHash, req.SignatureB64, req.CanaryPercent)
	if err != nil {
		slog.Error("api: campaign creation failed", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Publish OTA command via MQTT
	cmd := mqttclient.OTACommand{
		CampaignID:   cmp.ID,
		Version:      req.Version,
		FirmwareURL:  req.FirmwareURL,
		FirmwareHash: req.FirmwareHash,
		SignatureB64: req.SignatureB64,
		Targets:      cmp.Targets,
		Nonce:        uuid.NewString(),
		IssuedAt:     time.Now().UTC().Format(time.RFC3339),
		TTLSeconds:   300,
	}

	if d.Publisher != nil {
		if err := d.Publisher.PublishOTACommand(cmd); err != nil {
			slog.Warn("api: MQTT publish failed (campaign still queued)", "err", err)
		}
	}

	// Broadcast + persist event
	payload := gin.H{"campaign": cmp, "command": cmd}
	d.Hub.Broadcast(ws.Event{
		Type:      "ota_deploy_requested",
		Timestamp: time.Now().UTC(),
		Payload:   payload,
	})
	d.Events.Write(context.Background(), "ota_deploy_requested", payload)

	slog.Info("api: OTA campaign created", "id", cmp.ID, "targets", len(cmp.Targets), "canary", req.CanaryPercent)
	c.JSON(http.StatusOK, gin.H{
		"queued":     true,
		"campaignId": cmp.ID,
		"targets":    cmp.Targets,
		"count":      len(cmp.Targets),
	})
}

func (d *Deps) handleCampaigns(c *gin.Context) {
	all := d.Campaigns.GetAll()
	c.JSON(http.StatusOK, gin.H{"campaigns": all, "count": len(all)})
}

func (d *Deps) handleCampaign(c *gin.Context) {
	cmp, ok := d.Campaigns.Get(c.Param("id"))
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "campaign not found"})
		return
	}
	c.JSON(http.StatusOK, cmp)
}

func (d *Deps) handleEvents(c *gin.Context) {
	eventType := c.Query("type")
	limitStr := c.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 50
	}

	evts, err := d.Events.Query(context.Background(), eventType, limit)
	if err != nil {
		slog.Error("api: events query failed", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"events": evts, "count": len(evts)})
}
