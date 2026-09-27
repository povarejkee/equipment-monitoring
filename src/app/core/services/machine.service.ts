import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Machine, MachineStatus, MetricHistoryPoint, DowntimeEntry } from '../models/machine.model';
import { WebSocketService } from './websocket.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

/** Loading and failure are distinct from "loaded, but empty". */
export type MachinesState =
  | { status: 'loading' }
  | { status: 'loaded'; machines: Machine[] }
  | { status: 'error' };

export type MachineLookup =
  | { status: 'loading' }
  | { status: 'found'; machine: Machine }
  | { status: 'not-found' }
  | { status: 'error' };

@Injectable({ providedIn: 'root' })
export class MachineService {
  private stateSubject = new BehaviorSubject<MachinesState>({ status: 'loading' });
  state$ = this.stateSubject.asObservable();
  private started = false;

  constructor(private http: HttpClient, private ws: WebSocketService, private auth: AuthService) {
    // Subscribed exactly once for the lifetime of the service: a failed initial
    // GET re-runs ensureStarted(), and that must never add a second handler.
    this.ws.subscribe<Machine[]>('machines').subscribe((machines) => {
      this.stateSubject.next({ status: 'loaded', machines });
    });
    // The socket was down for a while — the snapshot has drifted, refetch it.
    this.ws.reconnected$.subscribe(() => {
      if (this.started) this.fetchSnapshot();
    });
  }

  /** Loads the initial snapshot and opens the live WebSocket stream. */
  private ensureStarted(): void {
    if (this.started) return;
    this.started = true;
    this.fetchSnapshot();
    // Token is read lazily on every (re)connect, never captured here.
    this.ws.connect(() => this.auth.token);
  }

  private fetchSnapshot(): void {
    this.http.get<Machine[]>(`${environment.apiUrl}/machines`).subscribe({
      next: (machines) => this.stateSubject.next({ status: 'loaded', machines }),
      error: () => {
        this.started = false;
        this.stateSubject.next({ status: 'error' });
      },
    });
  }

  /** Drops the cached snapshot so the next user never sees the previous one's data. */
  reset(): void {
    this.started = false;
    this.stateSubject.next({ status: 'loading' });
  }

  getState(): Observable<MachinesState> {
    this.ensureStarted();
    return this.state$;
  }

  getById(id: string): Observable<MachineLookup> {
    this.ensureStarted();
    return this.state$.pipe(
      map((s): MachineLookup => {
        if (s.status !== 'loaded') return s.status === 'error' ? { status: 'error' } : { status: 'loading' };
        const machine = s.machines.find((m) => m.id === id);
        return machine ? { status: 'found', machine } : { status: 'not-found' };
      })
    );
  }

  getHistory(machineId: string, hours: number): Observable<MetricHistoryPoint[]> {
    return this.http.get<MetricHistoryPoint[]>(
      `${environment.apiUrl}/machines/${machineId}/history`,
      { params: { hours: String(hours) } }
    );
  }

  getDowntimes(machineId: string): Observable<DowntimeEntry[]> {
    return this.http.get<DowntimeEntry[]>(`${environment.apiUrl}/machines/${machineId}/downtimes`);
  }

  /** Manager/admin only — stop/resume a machine (see canonical rules server-side). */
  updateStatus(machineId: string, status: MachineStatus, reason?: string): Observable<Machine> {
    return this.http
      .put<Machine>(`${environment.apiUrl}/machines/${machineId}/status`, { status, reason })
      .pipe(tap((updated) => this.mergeMachine(updated)));
  }

  /** Manager/admin only — set (or, with null, clear) the next scheduled maintenance date. */
  updateMaintenanceSchedule(machineId: string, nextMaintenanceAt: string | null): Observable<Machine> {
    return this.http
      .put<Machine>(`${environment.apiUrl}/machines/${machineId}/maintenance-schedule`, { nextMaintenanceAt })
      .pipe(tap((updated) => this.mergeMachine(updated)));
  }

  /** Applies a mutation response immediately instead of waiting for the
   * next ~4s WebSocket tick to reflect it. */
  private mergeMachine(updated: Machine): void {
    const s = this.stateSubject.value;
    if (s.status !== 'loaded') return;
    this.stateSubject.next({
      status: 'loaded',
      machines: s.machines.map((m) => (m.id === updated.id ? updated : m)),
    });
  }
}
