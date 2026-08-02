import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Alert, AlertThreshold } from '../models/alert.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  alerts$ = this.alertsSubject.asObservable();

  private thresholdsSubject = new BehaviorSubject<AlertThreshold[]>([]);
  thresholds$ = this.thresholdsSubject.asObservable();

  private loaded = false;

  constructor(private http: HttpClient) {}

  private ensureLoaded(): void {
    if (this.loaded) return;
    this.loaded = true;
    this.refresh();
    this.http.get<AlertThreshold[]>(`${environment.apiUrl}/thresholds`)
      .subscribe((t) => this.thresholdsSubject.next(t));
  }

  private refresh(): void {
    this.http.get<Alert[]>(`${environment.apiUrl}/alerts`)
      .subscribe((a) => this.alertsSubject.next(a));
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
      .subscribe((alerts) => this.alertsSubject.next(alerts));
  }

  acknowledgeAll(): void {
    this.http.post<Alert[]>(`${environment.apiUrl}/alerts/acknowledge-all`, {})
      .subscribe((alerts) => this.alertsSubject.next(alerts));
  }

  updateThreshold(metric: string, warningValue: number, criticalValue: number): void {
    this.http.put<AlertThreshold[]>(`${environment.apiUrl}/thresholds`, { metric, warningValue, criticalValue })
      .subscribe((t) => this.thresholdsSubject.next(t));
  }
}
