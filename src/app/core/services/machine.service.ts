import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Machine, MetricHistoryPoint, DowntimeEntry } from '../models/machine.model';
import { WebSocketService } from './websocket.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MachineService {
  private machinesSubject = new BehaviorSubject<Machine[]>([]);
  machines$ = this.machinesSubject.asObservable();
  private started = false;

  constructor(private http: HttpClient, private ws: WebSocketService, private auth: AuthService) {}

  /** Loads the initial snapshot and opens the live WebSocket stream. */
  private ensureStarted(): void {
    if (this.started) return;
    this.started = true;

    this.http.get<Machine[]>(`${environment.apiUrl}/machines`).subscribe({
      next: (machines) => this.machinesSubject.next(machines),
      error: () => this.started = false,
    });

    this.ws.connect(this.auth.token);
    this.ws.subscribe<Machine[]>('machines').subscribe((machines) => {
      this.machinesSubject.next(machines);
    });
  }

  getAll(): Observable<Machine[]> {
    this.ensureStarted();
    return this.machines$;
  }

  getById(id: string): Observable<Machine | undefined> {
    this.ensureStarted();
    return this.machines$.pipe(map((ms) => ms.find((m) => m.id === id)));
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
}
