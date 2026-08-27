import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportParams, ReportData } from '../models/report.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private http: HttpClient) {}

  generate(params: ReportParams): Observable<ReportData> {
    // HttpClient JSON-serializes Date fields via Date.prototype.toJSON(),
    // which converts to UTC. A date picked as "1 марта" at local midnight
    // (e.g. UTC+3) then becomes "28 февраля 21:00 UTC" — shifting the
    // requested range by the timezone offset at both boundaries. Re-anchor
    // each date to UTC midnight of the *same calendar date the user picked*
    // instead of letting the raw offset leak through.
    const normalized: ReportParams = {
      ...params,
      dateFrom: toUtcMidnight(params.dateFrom),
      dateTo: toUtcMidnight(params.dateTo),
    };
    return this.http.post<ReportData>(`${environment.apiUrl}/reports`, normalized);
  }
}

function toUtcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}
