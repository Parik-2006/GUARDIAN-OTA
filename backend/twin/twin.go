// Package twin implements the device twin registry: a thread-safe write-through
// cache of DeviceState objects that mirrors the reported state from each node
// directly into PostgreSQL.
package twin

import (
	"context"
	"encoding/json"
	"log/slog"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DeviceState is the canonical device twin model.
type DeviceState struct {
	DeviceID      string            `json:"deviceId"`
	Primary       bool              `json:"primary"`
	OTAVersion    string            `json:"otaVersion"`
	SafetyState   string            `json:"safetyState"`
	ECUStates     map[string]string `json:"ecuStates"`
	LastSeen      time.Time         `json:"lastSeen"`
	ThreatLevel   string            `json:"threatLevel"`
	OTAProgress   int               `json:"otaProgress"`
	OTAStatus     string            `json:"otaStatus"`
	SignatureOK   bool              `json:"signatureOk"`
	IntegrityOK   bool              `json:"integrityOk"`
	TLSHealthy    bool              `json:"tlsHealthy"`
	RollbackArmed bool              `json:"rollbackArmed"`
	CampaignID    string            `json:"campaignId,omitempty"`
}

// Registry is the device twin registry utilizing Postgres.
type Registry struct {
	mu     sync.RWMutex
	states map[string]*DeviceState
	pool   *pgxpool.Pool
}

// NewRegistry creates a registry bridged to the database.
func NewRegistry(pool *pgxpool.Pool) *Registry {
	return &Registry{
		states: make(map[string]*DeviceState),
		pool:   pool,
	}
}

// InitSchema sets up the database table and loads existing vehicles into cache.
func (r *Registry) InitSchema(ctx context.Context) error {
	if r.pool == nil {
		slog.Warn("twin: no database pool, running fully in memory")
		return nil
	}

	_, err := r.pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS devices (
			device_id TEXT PRIMARY KEY,
			primary_device BOOLEAN NOT NULL DEFAULT false,
			ota_version TEXT NOT NULL,
			safety_state TEXT NOT NULL,
			ecu_states JSONB NOT NULL,
			last_seen TIMESTAMPTZ NOT NULL,
			threat_level TEXT NOT NULL,
			ota_progress INT NOT NULL DEFAULT 0,
			ota_status TEXT NOT NULL DEFAULT 'online',
			signature_ok BOOLEAN NOT NULL DEFAULT true,
			integrity_ok BOOLEAN NOT NULL DEFAULT true,
			tls_healthy BOOLEAN NOT NULL DEFAULT true,
			rollback_armed BOOLEAN NOT NULL DEFAULT true,
			campaign_id TEXT
		);
		ALTER TABLE devices ADD COLUMN IF NOT EXISTS ota_status TEXT NOT NULL DEFAULT 'online';
	`)
	if err != nil {
		return err
	}

	rows, err := r.pool.Query(ctx, `
		SELECT device_id, primary_device, ota_version, safety_state, ecu_states, 
		last_seen, threat_level, ota_progress, ota_status, signature_ok, integrity_ok, 
		tls_healthy, rollback_armed, campaign_id FROM devices
	`)
	if err != nil {
		return err
	}
	defer rows.Close()

	r.mu.Lock()
	defer r.mu.Unlock()

	for rows.Next() {
		var d DeviceState
		var ecuBytes []byte
		var cmpId *string
		err := rows.Scan(
			&d.DeviceID, &d.Primary, &d.OTAVersion, &d.SafetyState, &ecuBytes,
			&d.LastSeen, &d.ThreatLevel, &d.OTAProgress, &d.OTAStatus, &d.SignatureOK, &d.IntegrityOK,
			&d.TLSHealthy, &d.RollbackArmed, &cmpId,
		)
		if err == nil {
			_ = json.Unmarshal(ecuBytes, &d.ECUStates)
			if cmpId != nil {
				d.CampaignID = *cmpId
			}
			r.states[d.DeviceID] = &d
		}
	}
	slog.Info("twin: loaded persistent devices from db", "count", len(r.states))
	return nil
}

// writeToDB securely flushes specific state to postgres natively handling insert/updates
func (r *Registry) writeToDB(d *DeviceState) {
	if r.pool == nil {
		return
	}
	ecuBytes, _ := json.Marshal(d.ECUStates)
	var cmpId *string
	if d.CampaignID != "" {
		cmpId = &d.CampaignID
	}

	_, err := r.pool.Exec(context.Background(), `
		INSERT INTO devices (
			device_id, primary_device, ota_version, safety_state, ecu_states, 
			last_seen, threat_level, ota_progress, ota_status, signature_ok, integrity_ok, 
			tls_healthy, rollback_armed, campaign_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		ON CONFLICT (device_id) DO UPDATE SET
			primary_device = EXCLUDED.primary_device,
			ota_version = EXCLUDED.ota_version,
			safety_state = EXCLUDED.safety_state,
			ecu_states = EXCLUDED.ecu_states,
			last_seen = EXCLUDED.last_seen,
			threat_level = EXCLUDED.threat_level,
			ota_progress = EXCLUDED.ota_progress,
			ota_status = EXCLUDED.ota_status,
			signature_ok = EXCLUDED.signature_ok,
			integrity_ok = EXCLUDED.integrity_ok,
			tls_healthy = EXCLUDED.tls_healthy,
			rollback_armed = EXCLUDED.rollback_armed,
			campaign_id = EXCLUDED.campaign_id
	`, d.DeviceID, d.Primary, d.OTAVersion, d.SafetyState, ecuBytes, 
		d.LastSeen, d.ThreatLevel, d.OTAProgress, d.OTAStatus, d.SignatureOK, d.IntegrityOK, 
		d.TLSHealthy, d.RollbackArmed, cmpId,
	)

	if err != nil {
		slog.Error("twin: postgres write failed", "device", d.DeviceID, "err", err)
	}
}

// Set upserts a device state.
func (r *Registry) Set(d *DeviceState) {
	r.mu.Lock()
	r.states[d.DeviceID] = d
	r.mu.Unlock()
	r.writeToDB(d)
}

// Get returns a copy of a device state; ok is false if not found.
func (r *Registry) Get(id string) (DeviceState, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, ok := r.states[id]
	if !ok {
		return DeviceState{}, false
	}
	return *s, true
}

// Update applies a mutation function to the device state (creates if absent).
func (r *Registry) Update(id string, fn func(*DeviceState)) {
	r.mu.Lock()
	s, ok := r.states[id]
	if !ok {
		s = &DeviceState{DeviceID: id}
		r.states[id] = s
	}
	fn(s)
	r.mu.Unlock()
	r.writeToDB(s)
}

// Snapshot returns a copy of all device states.
func (r *Registry) Snapshot() []DeviceState {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]DeviceState, 0, len(r.states))
	for _, s := range r.states {
		out = append(out, *s)
	}
	return out
}

// IDs returns all known device IDs.
func (r *Registry) IDs() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	ids := make([]string, 0, len(r.states))
	for id := range r.states {
		ids = append(ids, id)
	}
	return ids
}

// Len returns the total number of known devices.
func (r *Registry) Len() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.states)
}
