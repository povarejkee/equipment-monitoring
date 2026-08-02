import { Injectable } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';
import { environment } from '../../../environments/environment';

interface WsEnvelope {
  topic: string;
  payload: unknown;
}

/**
 * Real-time channel to the Go backend. Prepared in v1 as an interface;
 * in v2 it holds a live WebSocket connection that auto-reconnects.
 */
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messages$ = new Subject<WsEnvelope>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;

  connect(token?: string | null): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.manuallyClosed = false;
    const url = token ? `${environment.wsUrl}?token=${encodeURIComponent(token)}` : environment.wsUrl;
    this.socket = new WebSocket(url);

    this.socket.onmessage = (event) => {
      try {
        this.messages$.next(JSON.parse(event.data) as WsEnvelope);
      } catch {
        /* ignore malformed frames */
      }
    };
    this.socket.onclose = () => {
      this.socket = null;
      if (!this.manuallyClosed) this.scheduleReconnect(token);
    };
    this.socket.onerror = () => this.socket?.close();
  }

  /** Stream of payloads for a given topic (e.g. "machines"). */
  subscribe<T>(topic: string): Observable<T> {
    return this.messages$.pipe(
      filter((m) => m.topic === topic),
      map((m) => m.payload as T)
    );
  }

  disconnect(): void {
    this.manuallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
  }

  private scheduleReconnect(token?: string | null): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(token);
    }, 3000);
  }
}
