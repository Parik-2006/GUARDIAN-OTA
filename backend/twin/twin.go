// Package twin implements the device twin registry: a thread-safe in-memory
// store of DeviceState objects that mirrors the reported state from each ECU node.
package twin

import (
	"sync"
	"time"
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
	SignatureOK   bool              `json:"signatureOk"`
	IntegrityOK   bool              `json:"integrityOk"`
	TLSHealthy    bool              `json:"tlsHealthy"`
	RollbackArmed bool              `json:"rollbackArmed"`
	CampaignID    string            `json:"campaignId,omitempty"`
}

// Registry is the device twin registry.
type Registry struct {
	mu     sync.RWMutex
	states map[string]*DeviceState
}

// NewRegistry creates an empty registry.
func NewRegistry() *Registry {
	return &Registry{states: make(map[string]*DeviceState)}
}

// Set upserts a device state.
func (r *Registry) Set(d *DeviceState) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.states[d.DeviceID] = d
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
	defer r.mu.Unlock()
	s, ok := r.states[id]
	if !ok {
		s = &DeviceState{DeviceID: id}
		r.states[id] = s
	}
	fn(s)
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
