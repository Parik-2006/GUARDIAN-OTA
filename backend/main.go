package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"sdv-ota/backend/api"
	"sdv-ota/backend/blockchain"
	"sdv-ota/backend/campaign"
	"sdv-ota/backend/events"
	mqttclient "sdv-ota/backend/mqtt"
	"sdv-ota/backend/twin"
	"sdv-ota/backend/ws"
)

func main() {
	_ = godotenv.Load() // Load from .env if present

	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	// ── Infrastructure ────────────────────────────────────────────
	broker := getenv("MQTT_BROKER", "tcp://localhost:1883")
	mqttClient := mqttclient.Connect(broker)
	defer mqttClient.Disconnect(500)

	pool := initDB()
	evStore := events.NewStore(pool)
	if err := evStore.InitSchema(context.Background()); err != nil {
		slog.Warn("events: schema init failed", "err", err)
	}

	// ── Domain services ───────────────────────────────────────────
	registry := twin.NewRegistry(pool)
	if err := registry.InitSchema(context.Background()); err != nil {
		slog.Warn("twin: schema init failed", "err", err)
	}
	// bootstrapFleet(registry) // Disabled for Production: Hardware Only

	hub := ws.NewHub()
	mgr := campaign.NewManager(registry, pool)
	if err := mgr.InitSchema(context.Background()); err != nil {
		slog.Warn("campaigns: schema init failed", "err", err)
	}
	pub := mqttclient.NewPublisher(mqttClient)

	// ── Blockchain ────────────────────────────────────────────────
	bcSvc, err := blockchain.NewService()
	if err != nil {
		slog.Warn("blockchain service failed to init", "err", err)
	}

	// MQTT consumer — handle device status acks
	consumer := mqttclient.NewConsumer(mqttClient, func(update mqttclient.StatusUpdate) {
		slog.Info("mqtt: status received", "device", update.DeviceID, "status", update.Status, "progress", update.Status)
		// Always update the twin directly so fleet_tick broadcasts the latest
		// status immediately — regardless of whether UpdateDeviceStatus finds the campaign.
		registry.Update(update.DeviceID, func(d *twin.DeviceState) {
			d.LastSeen = time.Now().UTC()
			d.OTAStatus = update.Status
			switch update.Status {
			case "ack":
				d.OTAProgress = 10
			case "downloading":
				d.OTAProgress = 30
			case "verifying":
				d.OTAProgress = 75
			case "success":
				d.OTAProgress = 100
			case "online":
				// keep progress as-is after reboot
			case "error", "rollback":
				d.OTAProgress = 0
			}
		})

		mgr.UpdateDeviceStatus(update.CampaignID, update.DeviceID, update.Status, update.ErrorMsg)
		hub.Broadcast(ws.Event{
			Type:      "device_status",
			Timestamp: time.Now().UTC(),
			Payload:   update,
		})
		evStore.Write(context.Background(), "device_status", update)
	})
	consumer.SetECUHandler(func(update mqttclient.ECUStatusUpdate) {
		registry.Update(update.DeviceID, func(d *twin.DeviceState) {
			d.LastSeen = time.Now().UTC()
			if d.ECUStates == nil {
				d.ECUStates = make(map[string]string)
			}
			for k, v := range update.ECUStates {
				d.ECUStates[k] = v
			}
		})
		// Write to event store for the Activity Logs
		evStore.Write(context.Background(), "ecu_status_changed", update)
	})
	if err := consumer.Subscribe(); err != nil {
		slog.Warn("mqtt: consumer subscribe failed", "err", err)
	}

	// ── Telemetry Broadcaster ───────────────────────────────────────────
	go telemtryBroadcaster(context.Background(), registry, hub, evStore)

	// ── HTTP server ───────────────────────────────────────────────
	if getenv("GIN_MODE", "") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type,Authorization")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})
	r.Use(requestLogger())

	r.Static("/firmware_bin", "./firmware_bin")

	api.RegisterRoutes(r, &api.Deps{
		Registry:   registry,
		Campaigns:  mgr,
		Events:     evStore,
		Hub:        hub,
		Publisher:  pub,
		Blockchain: bcSvc,
	})

	addr := ":" + getenv("PORT", "8080")
	slog.Info("backend starting", "addr", addr)
	if err := r.Run(addr); err != nil {
		slog.Error("server failed", "err", err)
		os.Exit(1)
	}
}

// ── Helpers ───────────────────────────────────────────────────────

func getenv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func initDB() *pgxpool.Pool {
	dsn := getenv("DATABASE_URL", "postgres://ota:ota@localhost:5432/ota_control?sslmode=disable")
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		slog.Warn("database unavailable, running in-memory", "err", err)
		return nil
	}
	if err := pool.Ping(context.Background()); err != nil {
		slog.Warn("database ping failed, running in-memory", "err", err)
		return nil
	}
	slog.Info("database connected")
	return pool
}

func bootstrapFleet(reg *twin.Registry) {
	for i := 1; i <= 20; i++ {
		id := "sim-" + strconv.Itoa(1000+i)
		reg.Set(&twin.DeviceState{
			DeviceID:    id,
			Primary:     i == 1,
			OTAVersion:  "1.0.0",
			SafetyState: "SAFE",
			ECUStates: map[string]string{
				"brake": "green", "powertrain": "green",
				"sensor": "green", "infotainment": "green",
			},
			LastSeen:      time.Now().UTC(),
			ThreatLevel:   "LOW",
			TLSHealthy:    true,
			SignatureOK:   true,
			IntegrityOK:   true,
			RollbackArmed: true,
		})
	}
	slog.Info("fleet bootstrapped", "count", 20)
}

func telemtryBroadcaster(ctx context.Context, reg *twin.Registry, hub *ws.Hub, evStore *events.Store) {
	ticker := time.NewTicker(1000 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			snap := reg.Snapshot()
			if len(snap) > 0 {
				hub.Broadcast(ws.Event{
					Type:      "fleet_tick",
					Timestamp: time.Now().UTC(),
					Payload:   snap,
				})
			}
		}
	}
}

func requestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		slog.Info("http",
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"latency_ms", time.Since(start).Milliseconds(),
		)
	}
}
