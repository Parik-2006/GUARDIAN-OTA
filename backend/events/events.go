// Package events provides an event sourcing layer that persists OTA lifecycle
// events to PostgreSQL when available, and silently degrades to a no-op otherwise.
package events

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Store writes and reads OTA events.
type Store struct {
	pool *pgxpool.Pool // nil = in-memory degraded mode
}

// OTAEvent is a persisted event record.
type OTAEvent struct {
	ID        int64           `json:"id"`
	EventType string          `json:"eventType"`
	Payload   json.RawMessage `json:"payload"`
	CreatedAt time.Time       `json:"createdAt"`
}

// NewStore configures the event store. If pool is nil, writes are silent no-ops.
func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

// InitSchema ensures the ota_events table exists.
func (s *Store) InitSchema(ctx context.Context) error {
	if s.pool == nil {
		return nil
	}
	_, err := s.pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS ota_events (
			id         BIGSERIAL PRIMARY KEY,
			event_type TEXT        NOT NULL,
			payload    JSONB       NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
		CREATE INDEX IF NOT EXISTS ota_events_type_idx ON ota_events(event_type);
	`)
	return err
}

// Write persists a structured event. Payload must be JSON-serializable.
func (s *Store) Write(ctx context.Context, eventType string, payload any) {
	if s.pool == nil {
		return
	}
	b, err := json.Marshal(payload)
	if err != nil {
		slog.Error("events: marshal failed", "type", eventType, "err", err)
		return
	}
	if _, err := s.pool.Exec(ctx,
		"INSERT INTO ota_events(event_type, payload) VALUES ($1, $2)",
		eventType, b,
	); err != nil {
		slog.Error("events: insert failed", "type", eventType, "err", err)
	}
}

// Query returns up to limit events of the given type (newest first).
// If eventType is empty, all event types are returned.
func (s *Store) Query(ctx context.Context, eventType string, limit int) ([]OTAEvent, error) {
	if s.pool == nil {
		return []OTAEvent{}, nil
	}
	if limit <= 0 {
		limit = 50
	}

	var rows pgxRows
	var err error
	if eventType == "" {
		rows, err = s.pool.Query(ctx,
			`SELECT id, event_type, payload, created_at FROM ota_events
			 ORDER BY created_at DESC LIMIT $1`, limit)
	} else {
		rows, err = s.pool.Query(ctx,
			`SELECT id, event_type, payload, created_at FROM ota_events
			 WHERE event_type = $1 ORDER BY created_at DESC LIMIT $2`, eventType, limit)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []OTAEvent
	for rows.Next() {
		var e OTAEvent
		if err := rows.Scan(&e.ID, &e.EventType, &e.Payload, &e.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

// pgxRows is a local interface matching pgx rows to avoid importing pgx at call sites.
type pgxRows interface {
	Next() bool
	Scan(...any) error
	Close()
	Err() error
}
