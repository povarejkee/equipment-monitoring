import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportParams, ReportData } from '../models/report.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private http: HttpClient) {}

  generate(params: ReportParams): Observable<ReportData> {
    return this.http.post<ReportData>(`${environment.apiUrl}/reports`, params);
  }
}
