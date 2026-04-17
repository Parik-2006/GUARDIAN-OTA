package main

import (
	"context"
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
	mqtt "github.com/paho.mqtt.golang"
)

type OTARequest struct {
	Version       string `json:"version"`
	FirmwareURL   string `json:"firmwareUrl"`
	FirmwareHash  string `json:"firmwareHash"`
	SignatureB64  string `json:"signatureB64"`
	CanaryPercent int    `json:"canaryPercent"`
}

type DeviceState struct {
	DeviceID      string            `json:"deviceId"`
	Primary       bool              `json:"primary"`
	OTAVersion    string            `json:"otaVersion"`
	SafetyState   string            `json:"safetyState"`
	ECUStates     map[string]string `json:"ecuStates"`
	LastSeen      time.Time         `json:"lastSeen"`
	ThreatLevel   string            `json:"threatLevel"`
	OTAProgress   int               `json:"otaProgress"`
	SignatureOK   bool              `json:"signatureOk"`
	IntegrityOK   bool              `json:"integrityOk"`
	TLSHealthy    bool              `json:"tlsHealthy"`
	RollbackArmed bool              `json:"rollbackArmed"`
}

type Event struct {
	Type      string      `json:"type"`
	Timestamp time.Time   `json:"timestamp"`
	Payload   interface{} `json:"payload"`
}

type Hub struct {
	mu      sync.RWMutex
	clients map[*websocket.Conn]bool
}

func (h *Hub) Broadcast(evt Event) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.clients {
		_ = c.WriteJSON(evt)
	}
}

func (h *Hub) Add(c *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[c] = true
}

func (h *Hub) Remove(c *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, c)
	_ = c.Close()
}

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
	states = map[string]*DeviceState{}
	smu    sync.RWMutex
	hub    = &Hub{clients: map[*websocket.Conn]bool{}}
	dbpool *pgxpool.Pool
)

func main() {
	rand.Seed(time.Now().UnixNano())
	broker := getenv("MQTT_BROKER", "tcp://localhost:1883")
	client := connectMQTT(broker)
	defer client.Disconnect(500)

	bootstrapFleet()
	initDB()
	go fleetSimulator(context.Background())

	r := gin.Default()
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
	r.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"ok": true}) })
	r.GET("/api/fleet", handleFleet)
	r.POST("/api/ota/deploy", func(c *gin.Context) { handleDeploy(c, client) })
	r.GET("/ws/events", handleWS)

	addr := ":" + getenv("PORT", "8080")
	log.Printf("backend listening at %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}

func handleFleet(c *gin.Context) {
	smu.RLock()
	defer smu.RUnlock()
	out := make([]*DeviceState, 0, len(states))
	for _, s := range states {
		copy := *s
		out = append(out, &copy)
	}
	c.JSON(http.StatusOK, gin.H{"devices": out})
}

func handleDeploy(c *gin.Context, client mqtt.Client) {
	var req OTARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.CanaryPercent < 1 || req.CanaryPercent > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "canaryPercent must be 1-100"})
		return
	}

	targets := canaryTargets(req.CanaryPercent)
	cmd := gin.H{
		"version":      req.Version,
		"firmwareUrl":  req.FirmwareURL,
		"firmwareHash": req.FirmwareHash,
		"signatureB64": req.SignatureB64,
		"targets":      targets,
	}
	body, _ := json.Marshal(cmd)
	token := client.Publish("sdv/ota/command", 1, false, body)
	token.Wait()

	hub.Broadcast(Event{
		Type:      "ota_deploy_requested",
		Timestamp: time.Now().UTC(),
		Payload: gin.H{
			"request": req,
			"targets": targets,
		},
	})
	writeEvent("ota_deploy_requested", gin.H{"request": req, "targets": targets})
	c.JSON(http.StatusOK, gin.H{"queued": true, "targets": targets})
}

func handleWS(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	hub.Add(conn)
	defer hub.Remove(conn)
	for {
		if _, _, err := conn.NextReader(); err != nil {
			return
		}
	}
}

func connectMQTT(broker string) mqtt.Client {
	opts := mqtt.NewClientOptions().AddBroker(broker)
	opts.SetClientID("sdv-backend-" + strconv.Itoa(rand.Intn(10000)))
	opts.SetAutoReconnect(true)
	opts.SetCleanSession(true)
	client := mqtt.NewClient(opts)
	token := client.Connect()
	token.Wait()
	if err := token.Error(); err != nil {
		log.Printf("mqtt connection failed (continuing with simulator only): %v", err)
	}
	return client
}

func bootstrapFleet() {
	smu.Lock()
	defer smu.Unlock()
	for i := 1; i <= 20; i++ {
		id := "sim-" + strconv.Itoa(1000+i)
		states[id] = &DeviceState{
			DeviceID:    id,
			Primary:     i == 1,
			OTAVersion:  "1.0.0",
			SafetyState: "SAFE",
			ECUStates: map[string]string{
				"brake":        "green",
				"powertrain":   "green",
				"sensor":       "green",
				"infotainment": "green",
			},
			LastSeen:      time.Now().UTC(),
			ThreatLevel:   "LOW",
			TLSHealthy:    true,
			SignatureOK:   true,
			IntegrityOK:   true,
			RollbackArmed: true,
		}
	}
}

func initDB() {
	dsn := getenv("DATABASE_URL", "postgres://ota:ota@localhost:5432/ota_control?sslmode=disable")
	var err error
	dbpool, err = pgxpool.New(context.Background(), dsn)
	if err != nil {
		log.Printf("database unavailable, running in memory mode: %v", err)
		return
	}
	_, err = dbpool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS ota_events (
			id BIGSERIAL PRIMARY KEY,
			event_type TEXT NOT NULL,
			payload JSONB NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)
	if err != nil {
		log.Printf("failed creating ota_events table: %v", err)
	}
}

func fleetSimulator(ctx context.Context) {
	t := time.NewTicker(1200 * time.Millisecond)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			smu.Lock()
			for _, s := range states {
				s.LastSeen = time.Now().UTC()
				if rand.Float64() < 0.05 {
					s.ECUStates["sensor"] = "warning"
					s.ThreatLevel = "MEDIUM"
				} else if rand.Float64() < 0.02 {
					s.ECUStates["brake"] = "failure"
					s.SafetyState = "UNSAFE"
					s.ThreatLevel = "HIGH"
				} else {
					s.ECUStates["sensor"] = "green"
					s.ECUStates["brake"] = "green"
					s.SafetyState = "SAFE"
					s.ThreatLevel = "LOW"
				}
			}
			payload := snapshot()
			smu.Unlock()
			hub.Broadcast(Event{
				Type:      "fleet_tick",
				Timestamp: time.Now().UTC(),
				Payload:   payload,
			})
			writeEvent("fleet_tick", payload)
		}
	}
}

func snapshot() []DeviceState {
	out := make([]DeviceState, 0, len(states))
	for _, s := range states {
		out = append(out, *s)
	}
	return out
}

func canaryTargets(percent int) []string {
	smu.RLock()
	defer smu.RUnlock()
	targets := []string{}
	for id := range states {
		if rand.Intn(100) < percent {
			targets = append(targets, id)
		}
	}
	if len(targets) == 0 {
		for id := range states {
			targets = append(targets, id)
			break
		}
	}
	return targets
}

func getenv(k, d string) string {
	v := os.Getenv(k)
	if v == "" {
		return d
	}
	return v
}

func writeEvent(eventType string, payload interface{}) {
	if dbpool == nil {
		return
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return
	}
	_, _ = dbpool.Exec(context.Background(),
		"INSERT INTO ota_events(event_type, payload) VALUES ($1, $2)", eventType, b)
}

