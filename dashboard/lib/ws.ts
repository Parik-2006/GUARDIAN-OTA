// lib/ws.ts — useWebSocket hook with auto-reconnect and typed event dispatch

import { useEffect, useRef, useCallback } from "react";

export interface WSEvent<T = unknown> {
  type: string;
  timestamp: string;
  payload: T;
}

export type WSEventHandler = (evt: WSEvent) => void;

const RECONNECT_INTERVALS = [1000, 2000, 4000, 8000, 15000]; // exponential backoff ms

/**
 * useWebSocket — connects to the backend WebSocket endpoint and calls onEvent
 * for every received message. Auto-reconnects with exponential backoff.
 *
 * @param url      WebSocket URL (e.g. "ws://localhost:8080/ws/events")
 * @param onEvent  Callback fired with each parsed WSEvent
 * @param enabled  Set to false to prevent connection (e.g. while infra is down)
 */
export function useWebSocket(url: string, onEvent: WSEventHandler, enabled = true) {
  const wsRef    = useRef<WebSocket | null>(null);
  const attempt  = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      attempt.current = 0; // reset backoff on successful connection
    };

    ws.onmessage = (e) => {
      try {
        const evt: WSEvent = JSON.parse(e.data);
        onEventRef.current(evt);
      } catch {
        // non-JSON message (e.g. ping frame as text) — ignore
      }
    };

    ws.onclose = () => {
      if (!enabled) return;
      const delay = RECONNECT_INTERVALS[Math.min(attempt.current, RECONNECT_INTERVALS.length - 1)];
      attempt.current++;
      timerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close(); // triggers onclose → reconnect
    };
  }, [url, enabled]);

  useEffect(() => {
    connect();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);
}
