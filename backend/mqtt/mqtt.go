// Package mqtt provides separated MQTT publisher and consumer helpers.
// Publisher: publishes typed OTA commands.
// Consumer: subscribes to device status/ack topics and dispatches to handlers.
package mqtt

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"math/rand"
	"strconv"
	"time"

	pahomqtt "github.com/eclipse/paho.mqtt.golang"
)

// OTACommand is the canonical OTA command published to sdv/ota/command.
type OTACommand struct {
	CampaignID   string   `json:"campaign_id"`
	Version      string   `json:"version"`
	FirmwareURL  string   `json:"firmware_url"`
	FirmwareHash string   `json:"firmware_hash"`
	SignatureB64 string   `json:"signature_b64"`
	Targets      []string `json:"targets"`
	Nonce        string   `json:"nonce"`
	IssuedAt     string   `json:"issued_at"`
	TTLSeconds   int      `json:"ttl_seconds"`
}

// StatusUpdate is received from devices on sdv/ota/status/<device_id>.
type StatusUpdate struct {
	DeviceID   string `json:"device_id"`
	CampaignID string `json:"campaign_id"`
	Status     string `json:"status"` // "ack" | "downloading" | "verifying" | "success" | "rollback" | "error"
	Version    string `json:"version"`
	ErrorMsg   string `json:"error,omitempty"`
}

// ECUStatusUpdate is received from devices on sdv/ecu/status/<device_id>.
type ECUStatusUpdate struct {
	DeviceID  string            `json:"device_id"`
	ECUStates map[string]string `json:"ecu_states"`
}

// -------------------------------------------------------------------
// Publisher
// -------------------------------------------------------------------

// Publisher wraps the MQTT client for outbound OTA messages.
type Publisher struct {
	client pahomqtt.Client
}

// NewPublisher wraps an already-connected MQTT client.
func NewPublisher(c pahomqtt.Client) *Publisher {
	return &Publisher{client: c}
}

// PublishOTACommand marshals cmd and publishes it on sdv/ota/command at QoS-1.
func (p *Publisher) PublishOTACommand(cmd OTACommand) error {
	b, err := json.Marshal(cmd)
	if err != nil {
		return fmt.Errorf("mqtt publish: marshal: %w", err)
	}
	token := p.client.Publish("sdv/ota/command", 1, false, b)
	token.Wait()
	if err := token.Error(); err != nil {
		return fmt.Errorf("mqtt publish: %w", err)
	}
	slog.Info("mqtt: published OTA command", "campaign", cmd.CampaignID, "targets", len(cmd.Targets))
	return nil
}

// PublishRebootCommand sends a direct reboot request to a specific device.
func (p *Publisher) PublishRebootCommand(deviceID string) error {
	payload := map[string]string{
		"action":    "reboot",
		"device_id": deviceID,
		"issued_at": time.Now().UTC().Format(time.RFC3339),
	}
	b, _ := json.Marshal(payload)
	token := p.client.Publish(fmt.Sprintf("sdv/device/command/%s", deviceID), 1, false, b)
	token.Wait()
	return token.Error()
}

// -------------------------------------------------------------------
// Consumer
// -------------------------------------------------------------------

// StatusHandler is called with parsed StatusUpdate messages.
type StatusHandler func(update StatusUpdate)

// ECUHandler is called with parsed ECUStatusUpdate messages.
type ECUHandler func(update ECUStatusUpdate)

// Consumer subscribes to device status topics.
type Consumer struct {
	client     pahomqtt.Client
	handler    StatusHandler
	ecuHandler ECUHandler
}

// NewConsumer creates a Consumer. Call Subscribe to start receiving.
func NewConsumer(c pahomqtt.Client, h StatusHandler) *Consumer {
	return &Consumer{client: c, handler: h}
}

// SetECUHandler registers the callback for hardware heartbeats.
func (c *Consumer) SetECUHandler(h ECUHandler) {
	c.ecuHandler = h
}

// Subscribe subscribes to both OTA status and ECU heartbeats.
func (c *Consumer) Subscribe() error {
	// Status updates
	c.client.Subscribe("sdv/ota/status/#", 1, func(_ pahomqtt.Client, msg pahomqtt.Message) {
		var update StatusUpdate
		if err := json.Unmarshal(msg.Payload(), &update); err != nil {
			slog.Warn("mqtt: unparseable status message", "topic", msg.Topic(), "err", err)
			return
		}
		c.handler(update)
	})

	// ECU Heartbeats
	c.client.Subscribe("sdv/ecu/status/#", 1, func(_ pahomqtt.Client, msg pahomqtt.Message) {
		var update ECUStatusUpdate
		if err := json.Unmarshal(msg.Payload(), &update); err != nil {
			slog.Warn("mqtt: unparseable ecu status", "topic", msg.Topic(), "err", err)
			return
		}
		if c.ecuHandler != nil {
			c.ecuHandler(update)
		}
	})

	return nil
}

// -------------------------------------------------------------------
// Connect helper
// -------------------------------------------------------------------

// Connect creates and connects a new MQTT client.
// Returns the client even on failure (simulator operates without MQTT).
func Connect(broker string) pahomqtt.Client {
	opts := pahomqtt.NewClientOptions().
		AddBroker(broker).
		SetClientID("sdv-backend-" + strconv.Itoa(rand.Intn(99999))).
		SetAutoReconnect(true).
		SetCleanSession(true).
		SetConnectTimeout(5 * time.Second).
		SetOnConnectHandler(func(_ pahomqtt.Client) {
			slog.Info("mqtt: connected", "broker", broker)
		}).
		SetConnectionLostHandler(func(_ pahomqtt.Client, err error) {
			slog.Warn("mqtt: connection lost", "err", err)
		})

	client := pahomqtt.NewClient(opts)
	token := client.Connect()
	token.Wait()
	if err := token.Error(); err != nil {
		slog.Warn("mqtt: initial connect failed (simulator-only mode)", "err", err)
	}
	return client
}
