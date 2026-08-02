import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ErrorLogEntry, ErrorType } from '../../../../core/models/error-log.model';

const TYPE_LABELS: Record<ErrorType, string> = {
  emergency_stop: 'Аварийный останов',
  overheating: 'Перегрев',
  mechanical_failure: 'Мех. неисправность',
  electrical_fault: 'Электрич. неисправность',
  sensor_failure: 'Отказ датчика',
  communication_lost: 'Потеря связи',
  software_error: 'Программная ошибка',
};

@Component({
  selector: 'app-error-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="dialog-header" [class.resolved]="!!entry.resolvedAt">
      <mat-icon>{{ entry.resolvedAt ? 'check_circle' : 'error' }}</mat-icon>
      <div>
        <h2 mat-dialog-title>{{ entry.errorCode }} — {{ typeLabel }}</h2>
        <p>{{ entry.machineName }}</p>
      </div>
    </div>
    <mat-dialog-content>
      <div class="detail-grid">
        <div class="detail-row">
          <span class="detail-key">Описание</span>
          <span class="detail-val">{{ entry.description }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Последствия</span>
          <span class="detail-val">{{ entry.impact }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Время ошибки</span>
          <span class="detail-val">{{ entry.timestamp | date:'dd.MM.yyyy HH:mm:ss' }}</span>
        </div>
        @if (entry.resolvedAt) {
          <div class="detail-row">
            <span class="detail-key">Устранена</span>
            <span class="detail-val">{{ entry.resolvedAt | date:'dd.MM.yyyy HH:mm:ss' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-key">Простой</span>
            <span class="detail-val">{{ entry.duration }} мин</span>
          </div>
        } @else {
          <div class="detail-row">
            <span class="detail-key">Статус</span>
            <span class="detail-val active">Активна</span>
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" mat-dialog-close>Закрыть</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header { display:flex; align-items:flex-start; gap:12px; padding:20px 24px 0; mat-icon{font-size:32px;width:32px;height:32px;color:#F44336;margin-top:4px;} &.resolved mat-icon{color:#4CAF50;} h2{margin:0;font-size:18px;} p{margin:4px 0 0;color:#757575;font-size:13px;} }
    ::ng-deep .mat-mdc-dialog-title { padding:0 !important; }
    .detail-grid { display:flex; flex-direction:column; gap:14px; padding:4px 0; }
    .detail-row { display:grid; grid-template-columns:140px 1fr; gap:8px; }
    .detail-key { font-size:13px; color:#9E9E9E; font-weight:500; }
    .detail-val { font-size:13px; color:#212121; &.active{color:#F44336;font-weight:600;} }
  `]
})
export class ErrorDetailDialogComponent {
  typeLabel: string;
  constructor(@Inject(MAT_DIALOG_DATA) public entry: ErrorLogEntry) {
    this.typeLabel = TYPE_LABELS[entry.errorType] ?? entry.errorType;
  }
}
