import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { AlertService, POLL_INTERVAL_MS } from './alert.service';
import { NotificationSoundService } from './notification-sound.service';
import { Alert, AlertSeverity, AlertType } from '../models/alert.model';
import { environment } from '../../../environments/environment';

// This suite uses Vitest's fake timers (not zone.js's fakeAsync/tick) to
// drive AlertService's interval()-based polling — the Angular unit-test
// builder's Vitest runner doesn't set up the ProxyZone that fakeAsync needs.

function makeAlert(id: string, severity: AlertSeverity, acknowledged = false): Alert {
  return {
    id,
    machineId: 'm1',
    machineName: 'Machine 1',
    type: AlertType.THRESHOLD_EXCEEDED,
    severity,
    message: 'test',
    metricName: 'temperature',
    currentValue: 100,
    thresholdValue: 90,
    timestamp: new Date(),
    acknowledged,
  };
}

describe('AlertService', () => {
  let service: AlertService;
  let httpMock: HttpTestingController;
  let sound: NotificationSoundService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AlertService);
    httpMock = TestBed.inject(HttpTestingController);
    sound = TestBed.inject(NotificationSoundService);
    vi.spyOn(sound, 'play').mockImplementation(() => {});
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  function flushInitialLoad(alerts: Alert[]): void {
    httpMock.expectOne(`${environment.apiUrl}/alerts`).flush(alerts);
    httpMock.expectOne(`${environment.apiUrl}/thresholds`).flush([]);
  }

  it('does not beep for critical alerts that are already present on first load', () => {
    service.getAll();
    flushInitialLoad([makeAlert('a1', AlertSeverity.CRITICAL)]);

    expect(sound.play).not.toHaveBeenCalled();
  });

  it('beeps when a poll introduces a new unacknowledged critical alert', () => {
    service.getAll();
    flushInitialLoad([makeAlert('a1', AlertSeverity.WARNING)]);

    vi.advanceTimersByTime(POLL_INTERVAL_MS);
    httpMock.expectOne(`${environment.apiUrl}/alerts`).flush([
      makeAlert('a1', AlertSeverity.WARNING),
      makeAlert('a2', AlertSeverity.CRITICAL),
    ]);

    expect(sound.play).toHaveBeenCalledTimes(1);
  });

  it('does not beep again for a critical alert it has already seen', () => {
    service.getAll();
    flushInitialLoad([makeAlert('a1', AlertSeverity.CRITICAL)]);

    vi.advanceTimersByTime(POLL_INTERVAL_MS);
    httpMock.expectOne(`${environment.apiUrl}/alerts`).flush([makeAlert('a1', AlertSeverity.CRITICAL)]);

    expect(sound.play).not.toHaveBeenCalled();
  });

  it('does not beep for a new critical alert that is already acknowledged', () => {
    service.getAll();
    flushInitialLoad([makeAlert('a1', AlertSeverity.WARNING)]);

    vi.advanceTimersByTime(POLL_INTERVAL_MS);
    httpMock.expectOne(`${environment.apiUrl}/alerts`).flush([
      makeAlert('a1', AlertSeverity.WARNING),
      makeAlert('a2', AlertSeverity.CRITICAL, true),
    ]);

    expect(sound.play).not.toHaveBeenCalled();
  });

  it('keeps polling every POLL_INTERVAL_MS for as long as it is subscribed', () => {
    service.getAll();
    flushInitialLoad([]);

    vi.advanceTimersByTime(POLL_INTERVAL_MS);
    httpMock.expectOne(`${environment.apiUrl}/alerts`).flush([]);

    vi.advanceTimersByTime(POLL_INTERVAL_MS);
    httpMock.expectOne(`${environment.apiUrl}/alerts`).flush([]);
  });

  it('recovers on the next load after a failed refresh instead of caching the failure', () => {
    service.getAll();
    httpMock.expectOne(`${environment.apiUrl}/alerts`).flush('boom', { status: 500, statusText: 'Server Error' });
    httpMock.expectOne(`${environment.apiUrl}/thresholds`).flush([]);

    service.getAll();
    flushInitialLoad([makeAlert('a1', AlertSeverity.CRITICAL)]);
  });
});
