import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, filter, map } from 'rxjs';
import { environment } from '../../../environments/environment';

interface WsEnvelope {
  topic: string;
  payload: unknown;
}

/** 1s, doubling per attempt, capped at 30s. */
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const MAX_RECONNECT_ATTEMPTS = 8;

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
  private reconnectAttempts = 0;
  /** Read lazily so every (re)connect uses the token that is valid *now*. */
  private tokenProvider: (() => string | null) | null = null;
  private hasConnected = false;

  private connectedSubject = new BehaviorSubject<boolean>(false);
  /** Live socket status — false while down, so the UI can say so. */
  readonly connected$ = this.connectedSubject.asObservable();

  private reconnectedSubject = new Subject<void>();
  /** Emits when the socket comes back up after a drop (resync your snapshot). */
  readonly reconnected$ = this.reconnectedSubject.asObservable();

  connect(tokenProvider?: (() => string | null) | null): void {
    if (tokenProvider) this.tokenProvider = tokenProvider;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.manuallyClosed = false;
    this.reconnectAttempts = 0;
    this.open();
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
    this.reconnectAttempts = 0;
    this.hasConnected = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    const socket = this.socket;
    this.socket = null;
    socket?.close();
    this.connectedSubject.next(false);
  }

  private open(): void {
    const token = this.tokenProvider?.() ?? null;
    const url = token ? `${environment.wsUrl}?token=${encodeURIComponent(token)}` : environment.wsUrl;
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.connectedSubject.next(true);
      if (this.hasConnected) this.reconnectedSubject.next();
      this.hasConnected = true;
    };
    socket.onmessage = (event) => {
      try {
        this.messages$.next(JSON.parse(event.data) as WsEnvelope);
      } catch {
        /* ignore malformed frames */
      }
    };
    socket.onclose = () => {
      if (this.socket !== socket) return; // superseded by disconnect()/reconnect
      this.socket = null;
      this.connectedSubject.next(false);
      if (!this.manuallyClosed) this.scheduleReconnect();
    };
    socket.onerror = () => socket.close();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.manuallyClosed) return;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
    const delay = Math.min(BASE_RECONNECT_DELAY * 2 ** this.reconnectAttempts, MAX_RECONNECT_DELAY);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.manuallyClosed) return;
      this.open();
    }, delay);
  }
}
