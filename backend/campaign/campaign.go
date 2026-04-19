// Package campaign manages persistent OTA campaign lifecycle logic, storing historical deployment targets
// securely within PostgreSQL tables.
package campaign

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/rand"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"sdv-ota/backend/twin"
)

// Status represents the lifecycle phase of a campaign.
type Status string

const (
	StatusQueued  Status = "queued"
	StatusRunning Status = "running"
	StatusDone    Status = "done"
	StatusFailed  Status = "failed"
	StatusPaused  Status = "paused"
)

// DeviceProgress tracks per-device OTA state within a campaign.
type DeviceProgress struct {
	DeviceID  string    `json:"deviceId"`
	Status    string    `json:"status"` // "pending"|"ack"|"downloading"|"verifying"|"success"|"rollback"|"error"
	UpdatedAt time.Time `json:"updatedAt"`
	Error     string    `json:"error,omitempty"`
}

// Campaign represents a single OTA rollout campaign.
type Campaign struct {
	ID            string                     `json:"id"`
	Version       string                     `json:"version"`
	FirmwareURL   string                     `json:"firmwareUrl"`
	FirmwareHash  string                     `json:"firmwareHash"`
	SignatureB64  string                     `json:"signatureB64"`
	CanaryPercent int                        `json:"canaryPercent"`
	Targets       []string                   `json:"targets"`
	Progress      map[string]*DeviceProgress `json:"progress"`
	Status        Status                     `json:"status"`
	CreatedAt     time.Time                  `json:"createdAt"`
	UpdatedAt     time.Time                  `json:"updatedAt"`
	SuccessCount  int                        `json:"successCount"`
	FailureCount  int                        `json:"failureCount"`
}

// Manager maintains all campaigns and applies persistent state transitions.
type Manager struct {
	mu        sync.RWMutex
	campaigns map[string]*Campaign
	registry  *twin.Registry
	pool      *pgxpool.Pool
}

// NewManager creates a database-backed campaign manager.
func NewManager(reg *twin.Registry, pool *pgxpool.Pool) *Manager {
	return &Manager{
		campaigns: make(map[string]*Campaign),
		registry:  reg,
		pool:      pool,
	}
}

// InitSchema structures the campaign logging framework into PostgreSQL and loads past payloads.
func (m *Manager) InitSchema(ctx context.Context) error {
	if m.pool == nil {
		slog.Warn("campaigns: no database pool, running fully in memory")
		return nil
	}

	_, err := m.pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS campaigns (
			id TEXT PRIMARY KEY,
			version TEXT NOT NULL,
			firmware_url TEXT NOT NULL,
			firmware_hash TEXT NOT NULL,
			signature_b64 TEXT NOT NULL,
			canary_percent INT NOT NULL,
			targets JSONB NOT NULL,
			progress JSONB NOT NULL,
			status TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL,
			success_count INT NOT NULL,
			failure_count INT NOT NULL
		);
	`)
	if err != nil {
		return err
	}

	rows, err := m.pool.Query(ctx, `
		SELECT id, version, firmware_url, firmware_hash, signature_b64, canary_percent, 
		targets, progress, status, created_at, updated_at, success_count, failure_count FROM campaigns
	`)
	if err != nil {
		return err
	}
	defer rows.Close()

	m.mu.Lock()
	defer m.mu.Unlock()

	for rows.Next() {
		var c Campaign
		var tgtBytes, progBytes []byte
		err := rows.Scan(
			&c.ID, &c.Version, &c.FirmwareURL, &c.FirmwareHash, &c.SignatureB64,
			&c.CanaryPercent, &tgtBytes, &progBytes, &c.Status,
			&c.CreatedAt, &c.UpdatedAt, &c.SuccessCount, &c.FailureCount,
		)
		if err == nil {
			_ = json.Unmarshal(tgtBytes, &c.Targets)
			_ = json.Unmarshal(progBytes, &c.Progress)
			m.campaigns[c.ID] = &c
		}
	}
	slog.Info("campaigns: loaded historical OTA payloads from db", "count", len(m.campaigns))
	return nil
}

// writeToDB flushes the heavy campaign structs accurately into JSONB fields
func (m *Manager) writeToDB(c *Campaign) {
	if m.pool == nil {
		return
	}
	targetsBytes, _ := json.Marshal(c.Targets)
	progressBytes, _ := json.Marshal(c.Progress)

	_, err := m.pool.Exec(context.Background(), `
		INSERT INTO campaigns (
			id, version, firmware_url, firmware_hash, signature_b64, canary_percent, 
			targets, progress, status, created_at, updated_at, success_count, failure_count
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		ON CONFLICT (id) DO UPDATE SET
			status = EXCLUDED.status,
			updated_at = EXCLUDED.updated_at,
			success_count = EXCLUDED.success_count,
			failure_count = EXCLUDED.failure_count,
			progress = EXCLUDED.progress
	`, c.ID, c.Version, c.FirmwareURL, c.FirmwareHash, c.SignatureB64, 
		c.CanaryPercent, targetsBytes, progressBytes, c.Status, 
		c.CreatedAt, c.UpdatedAt, c.SuccessCount, c.FailureCount,
	)
	if err != nil {
		slog.Error("campaigns: postgres write failed", "campaign", c.ID, "err", err)
	}
}

// Create builds a newly isolated or broad OTA push depending on the config arguments.
func (m *Manager) Create(version, url, hash, sigB64 string, canaryPct int, targetDevice string) (*Campaign, error) {
	if canaryPct < 1 || canaryPct > 100 {
		return nil, fmt.Errorf("canaryPercent must be 1–100, got %d", canaryPct)
	}

	var targets []string
	if targetDevice != "" {
		targets = []string{targetDevice}
	} else {
		targets = m.selectTargets(canaryPct)
		if len(targets) == 0 {
			return nil, fmt.Errorf("no devices registered in fleet")
		}
	}

	id := fmt.Sprintf("cmp-%d", time.Now().UnixMilli())
	progress := make(map[string]*DeviceProgress, len(targets))
	for _, t := range targets {
		progress[t] = &DeviceProgress{DeviceID: t, Status: "pending", UpdatedAt: time.Now().UTC()}
        
		// Hard-reset the edge device progress meters across the mesh
		m.registry.Update(t, func(d *twin.DeviceState) {
			d.OTAProgress = 0
			d.CampaignID = id
		})
	}

	c := &Campaign{
		ID:            id,
		Version:       version,
		FirmwareURL:   url,
		FirmwareHash:  hash,
		SignatureB64:  sigB64,
		CanaryPercent: canaryPct,
		Targets:       targets,
		Progress:      progress,
		Status:        StatusQueued,
		CreatedAt:     time.Now().UTC(),
		UpdatedAt:     time.Now().UTC(),
	}

	m.mu.Lock()
	m.campaigns[id] = c
	m.mu.Unlock()
	m.writeToDB(c)
	return c, nil
}

// UpdateDeviceStatus merges progress pings asynchronously sent over MQTT bridging.
func (m *Manager) UpdateDeviceStatus(campaignID, deviceID, status, errMsg string) {
	m.mu.Lock()
	c, ok := m.campaigns[campaignID]
	if !ok {
		m.mu.Unlock()
		return
	}

	dp, ok := c.Progress[deviceID]
	if !ok {
		dp = &DeviceProgress{DeviceID: deviceID}
		c.Progress[deviceID] = dp
	}
	dp.Status = status
	dp.Error = errMsg
	dp.UpdatedAt = time.Now().UTC()

	// Recount outcomes
	success, failure, pending := 0, 0, 0
	for _, p := range c.Progress {
		switch p.Status {
		case "success":
			success++
		case "error", "rollback":
			failure++
		default:
			pending++
		}
	}
	c.SuccessCount = success
	c.FailureCount = failure
	c.UpdatedAt = time.Now().UTC()

	// Advance campaign status
	if c.Status == StatusRunning && pending == 0 {
		if failure == 0 {
			c.Status = StatusDone
		} else if success == 0 {
			c.Status = StatusFailed
		} else {
			c.Status = StatusDone 
		}
	}
	if c.Status == StatusQueued {
		c.Status = StatusRunning
	}
	m.mu.Unlock()

	// Flush to SQL post lock
	m.writeToDB(c)

	// Mirror progress to device twin globally
	m.registry.Update(deviceID, func(d *twin.DeviceState) {
		d.CampaignID = campaignID
		d.OTAStatus = status
		switch status {
		case "success":
			d.OTAVersion = c.Version
			d.OTAProgress = 100
		case "downloading":
			d.OTAProgress = 30
		case "verifying":
			d.OTAProgress = 75
		case "pending", "ack":
			d.OTAProgress = 10
		case "online":
			d.OTAProgress = 0
			d.OTAStatus = "online"
		case "rollback", "error":
			d.OTAProgress = 0
			d.OTAStatus = status
		}
	})
}

// GetAll returns a snapshot of all historical campaigns deployed to Postgres.
func (m *Manager) GetAll() []Campaign {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]Campaign, 0, len(m.campaigns))
	for _, c := range m.campaigns {
		cp := *c
		out = append(out, cp)
	}
	for i := range out {
		for j := i + 1; j < len(out); j++ {
			if out[i].CreatedAt.Before(out[j].CreatedAt) {
				out[i], out[j] = out[j], out[i]
			}
		}
	}
	return out
}

// Get returns isolated metadata by ID.
func (m *Manager) Get(id string) (Campaign, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	c, ok := m.campaigns[id]
	if !ok {
		return Campaign{}, false
	}
	return *c, true
}

func (m *Manager) selectTargets(pct int) []string {
	ids := m.registry.IDs()
	if len(ids) == 0 {
		return nil
	}
	rand.Shuffle(len(ids), func(i, j int) { ids[i], ids[j] = ids[j], ids[i] })
	n := (len(ids) * pct) / 100
	if n < 1 {
		n = 1
	}
	return ids[:n]
}
