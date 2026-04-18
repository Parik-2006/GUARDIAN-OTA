// Package campaign manages OTA campaign lifecycle:
// creation → canary target selection → per-device progress tracking → completion.
package campaign

import (
	"fmt"
	"math/rand"
	"sync"
	"time"

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

// Manager maintains all campaigns and applies state transitions.
type Manager struct {
	mu        sync.RWMutex
	campaigns map[string]*Campaign
	registry  *twin.Registry
}

// NewManager creates a campaign manager backed by the given device twin registry.
func NewManager(reg *twin.Registry) *Manager {
	return &Manager{
		campaigns: make(map[string]*Campaign),
		registry:  reg,
	}
}

// Create builds a new campaign and selects canary targets from the registry.
// Returns the campaign. Does NOT publish the MQTT command — that is caller's responsibility.
func (m *Manager) Create(version, url, hash, sigB64 string, canaryPct int) (*Campaign, error) {
	if canaryPct < 1 || canaryPct > 100 {
		return nil, fmt.Errorf("canaryPercent must be 1–100, got %d", canaryPct)
	}

	targets := m.selectTargets(canaryPct)
	if len(targets) == 0 {
		return nil, fmt.Errorf("no devices registered in fleet")
	}

	id := fmt.Sprintf("cmp-%d", time.Now().UnixMilli())
	progress := make(map[string]*DeviceProgress, len(targets))
	for _, t := range targets {
		progress[t] = &DeviceProgress{DeviceID: t, Status: "pending", UpdatedAt: time.Now().UTC()}
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
	return c, nil
}

// UpdateDeviceStatus applies a status update received from a device via MQTT.
// Automatically advances campaign status to done/failed when all devices have reported.
func (m *Manager) UpdateDeviceStatus(campaignID, deviceID, status, errMsg string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	c, ok := m.campaigns[campaignID]
	if !ok {
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
			c.Status = StatusDone // partial success counts as done
		}
	}
	if c.Status == StatusQueued {
		c.Status = StatusRunning
	}

	// Mirror progress to device twin
	m.registry.Update(deviceID, func(d *twin.DeviceState) {
		d.CampaignID = campaignID
		switch status {
		case "success":
			d.OTAVersion = c.Version
			d.OTAProgress = 100
		case "downloading":
			d.OTAProgress = 30
		case "verifying":
			d.OTAProgress = 75
		case "rollback", "error":
			d.OTAProgress = 0
		}
	})
}

// GetAll returns a snapshot of all campaigns, newest first.
func (m *Manager) GetAll() []Campaign {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]Campaign, 0, len(m.campaigns))
	for _, c := range m.campaigns {
		cp := *c
		out = append(out, cp)
	}
	// sort newest first
	for i := range out {
		for j := i + 1; j < len(out); j++ {
			if out[i].CreatedAt.Before(out[j].CreatedAt) {
				out[i], out[j] = out[j], out[i]
			}
		}
	}
	return out
}

// Get returns a single campaign by ID.
func (m *Manager) Get(id string) (Campaign, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	c, ok := m.campaigns[id]
	if !ok {
		return Campaign{}, false
	}
	return *c, true
}

// selectTargets picks a percentage of registered device IDs at random.
// Always returns at least one device.
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
