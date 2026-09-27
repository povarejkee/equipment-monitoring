import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, concat, interval, of } from 'rxjs';
import { last, map, tap } from 'rxjs/operators';
import { Alert, AlertSeverity, AlertThreshold } from '../models/alert.model';
import { environment } from '../../../environments/environment';
import { NotificationSoundService } from './notification-sound.service';

/** How often to re-check for new alerts. There's no live push for alerts
 * (only "machines" is a WebSocket topic) — polling is the cheap, honest
 * middle ground between "never updates after page load" (the previous
 * behavior) and standing up a whole new push channel for this. */
const POLL_INTERVAL_MS = 25_000;

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
  private pollSub: Subscription | null = null;
  private knownAlertIds = new Set<string>();

  constructor(private http: HttpClient, private sound: NotificationSoundService) {}

  private ensureLoaded(): void {
    if (this.loaded) return;
    this.loaded = true;
    this.refresh();
    this.http.get<AlertThreshold[]>(`${environment.apiUrl}/thresholds`)
      .subscribe({
        next: (t) => this.thresholdsSubject.next(t),
        error: () => this.thresholdsSubject.next([]),
      });

    this.pollSub?.unsubscribe();
    this.pollSub = interval(POLL_INTERVAL_MS).subscribe(() => this.refresh());
  }

  private refresh(): void {
    this.http.get<Alert[]>(`${environment.apiUrl}/alerts`)
      .subscribe({
        next: (a) => {
          this.alertsFailedSubject.next(false);
          this.notifyOfNewCriticalAlerts(a);
          this.alertsSubject.next(a);
        },
        error: () => {
          // Let the next ensureLoaded() retry instead of caching a failed load.
          this.loaded = false;
          this.alertsFailedSubject.next(true);
        },
      });
  }

  /** Beeps once per refresh if it introduced a new, still-unacknowledged
   * critical alert — not on the very first load (that would beep for
   * every pre-existing critical alert the moment the app opens). */
  private notifyOfNewCriticalAlerts(alerts: Alert[]): void {
    const isFirstLoad = this.knownAlertIds.size === 0 && this.alertsSubject.value.length === 0;
    const newCritical = !isFirstLoad && alerts.some(
      (a) => a.severity === AlertSeverity.CRITICAL && !a.acknowledged && !this.knownAlertIds.has(a.id)
    );
    this.knownAlertIds = new Set(alerts.map((a) => a.id));
    if (newCritical) this.sound.play();
  }

  /** Drops the cached alerts so the next user never sees the previous one's data. */
  reset(): void {
    this.loaded = false;
    this.knownAlertIds = new Set();
    this.pollSub?.unsubscribe();
    this.pollSub = null;
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
