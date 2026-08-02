import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ErrorLogEntry } from '../models/error-log.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ErrorLogService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<ErrorLogEntry[]> {
    return this.http.get<ErrorLogEntry[]>(`${environment.apiUrl}/errors`);
  }
}
