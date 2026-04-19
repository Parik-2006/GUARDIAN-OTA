// Package api implements all HTTP route handlers for the GUARDIAN-OTA backend.
// Each handler is a thin adapter — business logic lives in campaign/twin/events packages.
package api

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"sdv-ota/backend/blockchain"
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
	Blockchain *blockchain.Service
}

// OTADeployRequest is the JSON body accepted by POST /api/ota/deploy.
type OTADeployRequest struct {
	Version       string `json:"version"       binding:"required"`
	FirmwareURL   string `json:"firmwareUrl"   binding:"required"`
	FirmwareHash  string `json:"firmwareHash"  binding:"required"`
	SignatureB64  string `json:"signatureB64"  binding:"required"`
	CanaryPercent int    `json:"canaryPercent"`
}

// TerminalRequest is the JSON body accepted by POST /api/terminal.
type TerminalRequest struct {
	Command string `json:"command" binding:"required"`
}

// RollbackRequest is the JSON body accepted by POST /api/ota/rollback.
type RollbackRequest struct {
	TargetDevice string `json:"targetDevice" binding:"required"`
}

// RegisterRoutes wires all routes onto the given Gin engine.
func RegisterRoutes(r *gin.Engine, d *Deps) {
	r.GET("/health", handleHealth)
	r.GET("/api/fleet", d.handleFleet)
	r.POST("/api/ota/deploy", d.handleDeploy)
	r.POST("/api/ota/upload", d.handleUpload)
	r.GET("/api/campaigns", d.handleCampaigns)
	r.GET("/api/campaigns/:id", d.handleCampaign)
	r.GET("/api/events", d.handleEvents)
	r.POST("/api/terminal", d.handleTerminal)
	r.POST("/api/ota/rollback", d.handleRollback)
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
	cmp, err := d.Campaigns.Create(req.Version, req.FirmwareURL, req.FirmwareHash, req.SignatureB64, req.CanaryPercent, "")
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

func (d *Deps) handleRollback(c *gin.Context) {
	var req RollbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	slog.Info("api: rollback requested", "device", req.TargetDevice)

	// Publish rollback command via MQTT
	if err := d.Publisher.PublishRollbackCommand(req.TargetDevice); err != nil {
		slog.Error("api: rollback publish failed", "err", err, "device", req.TargetDevice)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to publish rollback command"})
		return
	}

	// Log event
	d.Events.Write(context.Background(), "rollback_requested", map[string]string{
		"device_id": req.TargetDevice,
	})

	c.JSON(http.StatusOK, gin.H{"status": "queued", "device": req.TargetDevice})
}

func (d *Deps) handleUpload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file uploaded"})
		return
	}
	version := c.PostForm("version")
	if version == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "version required"})
		return
	}

	canaryStr := c.PostForm("canaryPercent")
	canaryPercent := 10
	if p, err := strconv.Atoi(canaryStr); err == nil {
		canaryPercent = p
	}
	targetDevice := c.PostForm("targetDevice")

	// Create firmware_bin dir
	os.MkdirAll("firmware_bin", 0755)

	// Save file
	hashName := "fw_" + uuid.NewString()[:8] + ".bin"
	filePath := filepath.Join("firmware_bin", hashName)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}

	// Read for hash
	fBytes, err := os.ReadFile(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "read failed"})
		return
	}
	h := sha256.Sum256(fBytes)
	hashHex := hex.EncodeToString(h[:])

	// Sign using external OpenSSL
	cmd := exec.Command("sh", "-c", "openssl dgst -sha256 -sign ota-key.pem "+filePath+" | base64 -w 0")
	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err != nil {
		slog.Error("signing failed", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "signing failed"})
		return
	}
	sigB64 := strings.TrimSpace(out.String())

	// Call Campaigns.Create
	host := c.Request.Host
	if strings.HasPrefix(host, "localhost") || strings.HasPrefix(host, "127.0.0.1") {
		_, port, err := net.SplitHostPort(host)
		if err != nil {
			port = "8080"
		}
		host = getLocalIP() + ":" + port
	}
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	firmwareURL := scheme + "://" + host + "/firmware_bin/" + hashName

	cmp, err := d.Campaigns.Create(version, firmwareURL, hashHex, sigB64, canaryPercent, targetDevice)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "campaign create failed"})
		return
	}

	// Publish OTA MQTT
	otaCmd := mqttclient.OTACommand{
		CampaignID:   cmp.ID,
		Version:      version,
		FirmwareURL:  firmwareURL,
		FirmwareHash: hashHex,
		SignatureB64: sigB64,
		Targets:      cmp.Targets,
		Nonce:        uuid.NewString(),
		IssuedAt:     time.Now().UTC().Format(time.RFC3339),
		TTLSeconds:   300,
	}
	if d.Publisher != nil {
		d.Publisher.PublishOTACommand(otaCmd)
	}

	// Blockchain Logger
	if d.Blockchain != nil {
		go func() {
			tx, err := d.Blockchain.LogFirmwareHash(context.Background(), version, hashHex)
			if err != nil {
				slog.Error("blockchain log failed", "err", err)
			} else {
				slog.Info("blockchain hash logged", "tx", tx)
			}
		}()
	}

	// Broadcast + persist
	payload := gin.H{"campaign": cmp, "command": otaCmd}
	d.Hub.Broadcast(ws.Event{Type: "ota_deploy_requested", Timestamp: time.Now().UTC(), Payload: payload})
	d.Events.Write(context.Background(), "ota_deploy_requested", payload)

	c.JSON(http.StatusOK, gin.H{
		"queued":     true,
		"campaignId": cmp.ID,
		"targets":    cmp.Targets,
		"count":      len(cmp.Targets),
		"txPending":  d.Blockchain != nil,
	})
}

func (d *Deps) handleTerminal(c *gin.Context) {
	var req TerminalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid command format"})
		return
	}

	parts := strings.Fields(req.Command)
	if len(parts) == 0 {
		c.JSON(http.StatusOK, gin.H{"status": "success", "output": []string{""}})
		return
	}

	cmd := parts[0]
	args := parts[1:]

	output := []string{}
	status := "success"

	switch cmd {
	case "fleet":
		if len(args) > 0 && args[0] == "list" {
			devices := d.Registry.Snapshot()
			output = append(output, "╔═══════════════════════════════════════════════════════╗")
			output = append(output, "║ DEVICE ID          │ STATUS      │ VERSION │ LAST SEEN   ║")
			output = append(output, "╟────────────────────┼─────────────┼─────────┼─────────────╢")
			for _, state := range devices {
				statusLine := state.OTAStatus
				if statusLine == "" {
					statusLine = "online"
				}
				output = append(output, fmt.Sprintf("║ %-18s │ %-11s │ %-7s │ %-11s ║",
					state.DeviceID, statusLine, state.OTAVersion, state.LastSeen.Format("15:04:05")))
			}
			output = append(output, "╚═══════════════════════════════════════════════════════╝")
		} else {
			output = []string{"Usage: fleet list"}
		}

	case "logs":
		if len(args) > 0 && args[0] == "show" {
			limit := 10
			if len(args) > 1 {
				if l, err := strconv.Atoi(args[1]); err == nil {
					limit = l
				}
			}
			evts, _ := d.Events.Query(context.Background(), "", limit)
			output = append(output, fmt.Sprintf("[INFO] Showing last %d system events:", len(evts)))
			for _, e := range evts {
				output = append(output, fmt.Sprintf("[%s] %-15s | %s",
					e.CreatedAt.Format("15:04:05"), e.EventType, string(e.Payload)))
			}
		} else {
			output = []string{"Usage: logs show [limit]"}
		}

	case "device":
		if len(args) > 1 && args[0] == "reboot" {
			deviceID := args[1]
			output = append(output, fmt.Sprintf("[INFO] Sending REBOOT command to %s...", deviceID))
			if d.Publisher != nil {
				if err := d.Publisher.PublishRebootCommand(deviceID); err != nil {
					output = append(output, "[ERROR] MQTT publish failed: "+err.Error())
					status = "error"
				} else {
					output = append(output, "✓ Command sent via MQTT bridge.")
				}
			} else {
				output = append(output, "[ERROR] MQTT publisher unavailable.")
				status = "error"
			}
		} else {
			output = []string{"Usage: device reboot <device_id>"}
		}

	case "blockchain":
		if d.Blockchain == nil {
			output = []string{"[ERROR] Blockchain service disabled."}
			status = "error"
		} else {
			output = append(output, "STATUS: CONNECTED (SEPOLIA)")
			output = append(output, "LAST TX: 0x...")
		}

	default:
		output = []string{fmt.Sprintf("[ERROR] Unknown command: %s", cmd), "Type 'help' for available commands."}
		status = "error"
	}

	c.JSON(http.StatusOK, gin.H{"status": status, "output": output})
}

func getLocalIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "127.0.0.1"
	}
	defer conn.Close()
	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}
