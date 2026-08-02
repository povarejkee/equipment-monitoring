import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, combineLatest, map } from 'rxjs';
import { Alert, AlertSeverity, AlertType, AlertThreshold } from '../../core/models/alert.model';
import { AlertService } from '../../core/services/alert.service';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { RoleVisibleDirective } from '../../shared/directives/role-visible.directive';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule, AsyncPipe, FormsModule,
    MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule,
    MatTableModule, MatInputModule, MatTooltipModule, MatTabsModule, MatSnackBarModule,
    RelativeTimePipe, RoleVisibleDirective
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  readonly UserRole = UserRole;

  allAlerts$!: Observable<Alert[]>;
  filteredAlerts$!: Observable<Alert[]>;
  thresholds$!: Observable<AlertThreshold[]>;

  filterSeverity = '';
  filterType = '';
  showAcknowledged = false;

  readonly severities = [
    { value: AlertSeverity.INFO, label: 'Инфо' },
    { value: AlertSeverity.WARNING, label: 'Предупреждение' },
    { value: AlertSeverity.CRITICAL, label: 'Критическое' },
  ];

  readonly types = [
    { value: AlertType.THRESHOLD_EXCEEDED, label: 'Превышение порога' },
    { value: AlertType.MACHINE_DOWN, label: 'Останов станка' },
    { value: AlertType.MACHINE_OFFLINE, label: 'Нет связи' },
    { value: AlertType.MAINTENANCE_DUE, label: 'ТО' },
    { value: AlertType.ANOMALY_DETECTED, label: 'Аномалия' },
  ];

  editingThresholds: AlertThreshold[] = [];

  constructor(
    public alertService: AlertService,
    public auth: AuthService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.allAlerts$ = this.alertService.getAll();
    this.thresholds$ = this.alertService.thresholds$;
    this.alertService.thresholds$.subscribe(t => {
      this.editingThresholds = t.map(x => ({ ...x }));
    });
    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredAlerts$ = this.allAlerts$.pipe(
      map(alerts => alerts.filter(a => {
        if (!this.showAcknowledged && a.acknowledged) return false;
        if (this.filterSeverity && a.severity !== this.filterSeverity) return false;
        if (this.filterType && a.type !== this.filterType) return false;
        return true;
      }))
    );
  }

  acknowledge(id: string): void {
    this.alertService.acknowledge(id);
  }

  acknowledgeAll(): void {
    this.alertService.acknowledgeAll();
    this.snack.open('Все уведомления подтверждены', '', { duration: 2000 });
  }

  saveThresholds(): void {
    this.editingThresholds.forEach(t => {
      this.alertService.updateThreshold(t.metric, t.warningValue, t.criticalValue);
    });
    this.snack.open('Пороги сохранены', '', { duration: 2000 });
  }

  sevIcon(sev: AlertSeverity): string {
    return { info: 'info', warning: 'warning', critical: 'error' }[sev] ?? 'info';
  }
}
