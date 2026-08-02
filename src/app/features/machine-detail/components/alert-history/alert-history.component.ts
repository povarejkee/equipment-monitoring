import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Alert, AlertSeverity } from '../../../../core/models/alert.model';
import { AlertService } from '../../../../core/services/alert.service';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-alert-history',
  standalone: true,
  imports: [CommonModule, MatIconModule, RelativeTimePipe],
  template: `
    <div class="section-card">
      <h3 class="section-title"><mat-icon>notifications_active</mat-icon> История алертов</h3>
      <div class="alert-list">
        @for (alert of alerts; track alert.id) {
          <div class="alert-item" [class]="'sev-' + alert.severity">
            <mat-icon class="alert-icon">{{ sevIcon(alert.severity) }}</mat-icon>
            <div class="alert-body">
              <div class="alert-message">{{ alert.message }}</div>
              <div class="alert-meta">{{ alert.timestamp | relativeTime }}</div>
            </div>
            @if (alert.acknowledged) {
              <mat-icon class="ack-icon" title="Подтверждено">check_circle</mat-icon>
            }
          </div>
        }
        @if (!alerts.length) {
          <div class="empty">Алертов нет</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .section-card { background:#fff; border-radius:12px; padding:20px; box-shadow:0 1px 4px rgba(0,0,0,0.07); }
    .section-title { display:flex; align-items:center; gap:8px; font-size:16px; font-weight:600; color:#212121; margin:0 0 16px; mat-icon{font-size:18px;width:18px;height:18px;color:#9E9E9E;} }
    .alert-list { display:flex; flex-direction:column; gap:8px; }
    .alert-item {
      display:flex; align-items:flex-start; gap:12px; padding:12px 14px; border-radius:8px; border-left:3px solid transparent;
      &.sev-info     { background:#F3F4FF; border-color:#5C6BC0; .alert-icon{color:#5C6BC0;} }
      &.sev-warning  { background:#FFF8E1; border-color:#FF9800; .alert-icon{color:#FF9800;} }
      &.sev-critical { background:#FFEBEE; border-color:#F44336; .alert-icon{color:#F44336;} }
    }
    .alert-icon { font-size:20px; width:20px; height:20px; margin-top:1px; flex-shrink:0; }
    .alert-message { font-size:13px; color:#212121; font-weight:500; }
    .alert-meta { font-size:11px; color:#9E9E9E; margin-top:2px; }
    .ack-icon { font-size:18px; width:18px; height:18px; color:#4CAF50; margin-left:auto; flex-shrink:0; }
    .empty { text-align:center; padding:20px; color:#9E9E9E; font-size:14px; }
  `]
})
export class AlertHistoryComponent implements OnInit {
  @Input() machineId!: string;
  alerts: Alert[] = [];

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    if (this.machineId) {
      this.alertService.getForMachine(this.machineId).subscribe(a => this.alerts = a.slice(0, 10));
    }
  }

  sevIcon(sev: AlertSeverity): string {
    return { info: 'info', warning: 'warning', critical: 'error' }[sev];
  }
}
