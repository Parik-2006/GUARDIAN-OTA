// Package ws provides a WebSocket hub for broadcasting typed OTA events
// to all connected dashboard clients.
package ws

import (
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 32 * 1024
)

// Event is the canonical WebSocket event envelope.
type Event struct {
	Type      string    `json:"type"`
	Timestamp time.Time `json:"timestamp"`
	Payload   any       `json:"payload"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin:     func(r *http.Request) bool { return true },
	ReadBufferSize:  1024,
	WriteBufferSize: 32 * 1024,
}

type client struct {
	conn *websocket.Conn
	send chan Event
}

// Hub manages connected WebSocket clients and broadcasts events to all of them.
type Hub struct {
	mu        sync.RWMutex
	clients   map[*client]struct{}
	broadcast chan Event
	register  chan *client
	unregist  chan *client
}

// NewHub creates a Hub and starts its run loop.
func NewHub() *Hub {
	h := &Hub{
		clients:   make(map[*client]struct{}),
		broadcast: make(chan Event, 256),
		register:  make(chan *client, 16),
		unregist:  make(chan *client, 16),
	}
	go h.run()
	return h
}

// Broadcast enqueues an event for delivery to all connected clients.
// Non-blocking: events are dropped if the internal channel is full.
func (h *Hub) Broadcast(evt Event) {
	select {
	case h.broadcast <- evt:
	default:
		slog.Warn("ws: broadcast channel full, dropping event", "type", evt.Type)
	}
}

// ServeHTTP upgrades an HTTP connection to WebSocket and registers it with the hub.
func (h *Hub) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("ws: upgrade failed", "err", err)
		return
	}
	c := &client{conn: conn, send: make(chan Event, 64)}
	h.register <- c
	go h.writePump(c)
	h.readPump(c) // blocks until disconnect
}

func (h *Hub) run() {
	for {
		select {
		case c := <-h.register:
			h.mu.Lock()
			h.clients[c] = struct{}{}
			h.mu.Unlock()
			slog.Info("ws: client connected", "addr", c.conn.RemoteAddr())

		case c := <-h.unregist:
			h.mu.Lock()
			if _, ok := h.clients[c]; ok {
				delete(h.clients, c)
				close(c.send)
			}
			h.mu.Unlock()
			slog.Info("ws: client disconnected", "addr", c.conn.RemoteAddr())

		case evt := <-h.broadcast:
			h.mu.RLock()
			for c := range h.clients {
				select {
				case c.send <- evt:
				default:
					// slow client — unregister asynchronously
					go func(cl *client) { h.unregist <- cl }(c)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// writePump delivers events from the client's send channel to the WebSocket connection.
func (h *Hub) writePump(c *client) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case evt, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteJSON(evt); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// readPump reads from the WebSocket (to detect disconnects and handle pongs).
func (h *Hub) readPump(c *client) {
	defer func() { h.unregist <- c }()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})
	for {
		if _, _, err := c.conn.NextReader(); err != nil {
			break
		}
	}
}
