import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Observable, switchMap } from 'rxjs';
import { MachineService, MachineLookup } from '../../core/services/machine.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { MetricsPanelComponent } from './components/metrics-panel/metrics-panel.component';
import { HistoryChartComponent } from './components/history-chart/history-chart.component';
import { DowntimeLogComponent } from './components/downtime-log/downtime-log.component';
import { AlertHistoryComponent } from './components/alert-history/alert-history.component';
import { MachineControlsComponent } from './components/machine-controls/machine-controls.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { RoleVisibleDirective } from '../../shared/directives/role-visible.directive';
import { UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-machine-detail',
  standalone: true,
  imports: [
    CommonModule, AsyncPipe, RouterModule, MatIconModule, MatButtonModule,
    StatusBadgeComponent, MetricsPanelComponent, HistoryChartComponent,
    DowntimeLogComponent, AlertHistoryComponent, MachineControlsComponent,
    LoadingSpinnerComponent, RoleVisibleDirective
  ],
  templateUrl: './machine-detail.component.html',
  styleUrls: ['./machine-detail.component.scss']
})
export class MachineDetailComponent implements OnInit {
  lookup$!: Observable<MachineLookup>;
  readonly UserRole = UserRole;

  readonly typeLabels: Record<string, string> = {
    cnc: 'ЧПУ', lathe: 'Токарный', milling: 'Фрезерный',
    grinding: 'Шлифовальный', press: 'Пресс'
  };

  constructor(private route: ActivatedRoute, private machineService: MachineService) {}

  ngOnInit(): void {
    this.lookup$ = this.route.paramMap.pipe(
      switchMap(params => this.machineService.getById(params.get('id')!))
    );
  }
}
