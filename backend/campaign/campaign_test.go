package campaign

import (
	"testing"

	"sdv-ota/backend/twin"
)

func TestCampaignManager(t *testing.T) {
	reg := twin.NewRegistry(nil)
	for i := 0; i < 10; i++ {
		reg.Update(string(rune('A'+i)), func(d *twin.DeviceState) {})
	}

	mgr := NewManager(reg, nil)

	// Test Create
	cmp, err := mgr.Create("2.0.0", "url", "hash", "sig", 50)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if len(cmp.Targets) != 5 { // 50% of 10
		t.Errorf("Expected 5 targets, got %d", len(cmp.Targets))
	}
	if cmp.Status != StatusQueued {
		t.Errorf("Expected queued status, got %s", cmp.Status)
	}

	// Test UpdateDeviceStatus
	tgt := cmp.Targets[0]
	mgr.UpdateDeviceStatus(cmp.ID, tgt, "downloading", "")
	
	updatedCmp, ok := mgr.Get(cmp.ID)
	if !ok {
		t.Fatal("Campaign not found")
	}
	if updatedCmp.Progress[tgt].Status != "downloading" {
		t.Errorf("Expected downloading, got %s", updatedCmp.Progress[tgt].Status)
	}
	if updatedCmp.Status != StatusRunning {
		t.Errorf("Expected running status, got %s", updatedCmp.Status)
	}

	// Test complete campaign
	for _, tID := range cmp.Targets {
		mgr.UpdateDeviceStatus(cmp.ID, tID, "success", "")
	}

	doneCmp, _ := mgr.Get(cmp.ID)
	if doneCmp.Status != StatusDone {
		t.Errorf("Expected done status, got %s", doneCmp.Status)
	}
	if doneCmp.SuccessCount != 5 {
		t.Errorf("Expected 5 successes, got %d", doneCmp.SuccessCount)
	}
}
