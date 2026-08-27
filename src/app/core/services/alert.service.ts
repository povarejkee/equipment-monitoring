import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, concat, of } from 'rxjs';
import { last, map, tap } from 'rxjs/operators';
import { Alert, AlertThreshold } from '../models/alert.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  alerts$ = this.alertsSubject.asObservable();

  private thresholdsSubject = new BehaviorSubject<AlertThreshold[]>([]);
  thresholds$ = this.thresholdsSubject.asObservable();

  /** True when the last /alerts fetch failed — an empty list is NOT the same as a failure. */
  private alertsFailedSubject = new BehaviorSubject<boolean>(false);
  alertsFailed$ = this.alertsFailedSubject.asObservable();

  private loaded = false;

  constructor(private http: HttpClient) {}

  private ensureLoaded(): void {
    if (this.loaded) return;
    this.loaded = true;
    this.refresh();
    this.http.get<AlertThreshold[]>(`${environment.apiUrl}/thresholds`)
      .subscribe({
        next: (t) => this.thresholdsSubject.next(t),
        error: () => this.thresholdsSubject.next([]),
      });
  }

  private refresh(): void {
    this.http.get<Alert[]>(`${environment.apiUrl}/alerts`)
      .subscribe({
        next: (a) => {
          this.alertsFailedSubject.next(false);
          this.alertsSubject.next(a);
        },
        error: () => {
          // Let the next ensureLoaded() retry instead of caching a failed load.
          this.loaded = false;
          this.alertsFailedSubject.next(true);
        },
      });
  }

  /** Drops the cached alerts so the next user never sees the previous one's data. */
  reset(): void {
    this.loaded = false;
    this.alertsSubject.next([]);
    this.thresholdsSubject.next([]);
    this.alertsFailedSubject.next(false);
  }

  getAll(): Observable<Alert[]> {
    this.ensureLoaded();
    return this.alerts$;
  }

  getUnacknowledged(): Observable<Alert[]> {
    this.ensureLoaded();
    return this.alerts$.pipe(map((a) => a.filter((x) => !x.acknowledged)));
  }

  getForMachine(machineId: string): Observable<Alert[]> {
    this.ensureLoaded();
    return this.alerts$.pipe(map((a) => a.filter((x) => x.machineId === machineId)));
  }

  getUnacknowledgedCount(): Observable<number> {
    this.ensureLoaded();
    return this.getUnacknowledged().pipe(map((a) => a.length));
  }

  acknowledge(id: string): void {
    this.http.post<Alert[]>(`${environment.apiUrl}/alerts/${id}/acknowledge`, {})
      .subscribe({ next: (alerts) => this.alertsSubject.next(alerts), error: () => {} });
  }

  acknowledgeAll(): void {
    this.http.post<Alert[]>(`${environment.apiUrl}/alerts/acknowledge-all`, {})
      .subscribe({ next: (alerts) => this.alertsSubject.next(alerts), error: () => {} });
  }

  /**
   * Persists thresholds one at a time. The endpoint takes a single metric and
   * answers with the whole list, so parallel PUTs would clobber each other —
   * `concat` sequences them and only the last response is applied.
   */
  saveThresholds(thresholds: AlertThreshold[]): Observable<AlertThreshold[]> {
    if (!thresholds.length) return of([]);
    const puts = thresholds.map((t) =>
      this.http.put<AlertThreshold[]>(`${environment.apiUrl}/thresholds`, {
        metric: t.metric,
        warningValue: t.warningValue,
        criticalValue: t.criticalValue,
      })
    );
    return concat(...puts).pipe(
      last(),
      tap((updated) => this.thresholdsSubject.next(updated))
    );
  }
}
