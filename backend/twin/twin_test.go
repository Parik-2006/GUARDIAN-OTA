package twin

import (
	"testing"
	"time"
)

func TestTwinRegistry(t *testing.T) {
	r := NewRegistry()

	// Test Set and Get
	dev := &DeviceState{
		DeviceID:    "sim-001",
		Primary:     true,
		OTAVersion:  "1.0",
		SafetyState: "SAFE",
	}
	r.Set(dev)

	if r.Len() != 1 {
		t.Errorf("Expected length 1, got %d", r.Len())
	}

	got, ok := r.Get("sim-001")
	if !ok {
		t.Fatalf("Expected to find device")
	}
	if got.OTAVersion != "1.0" {
		t.Errorf("Expected OTAVersion 1.0, got %s", got.OTAVersion)
	}

	// Test Update
	r.Update("sim-001", func(d *DeviceState) {
		d.LastSeen = time.Now()
		d.SafetyState = "UNSAFE"
	})

	gotUpdated, _ := r.Get("sim-001")
	if gotUpdated.SafetyState != "UNSAFE" {
		t.Errorf("Expected safety state UNSAFE, got %s", gotUpdated.SafetyState)
	}

	// Test Update creating new
	r.Update("sim-002", func(d *DeviceState) {
		d.OTAVersion = "2.0"
	})
	if r.Len() != 2 {
		t.Errorf("Expected length 2, got %d", r.Len())
	}

	// Test Snapshot
	snap := r.Snapshot()
	if len(snap) != 2 {
		t.Errorf("Expected snapshot length 2, got %d", len(snap))
	}

	// Test IDs
	ids := r.IDs()
	if len(ids) != 2 {
		t.Errorf("Expected 2 IDs, got %d", len(ids))
	}
}
