import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ReportData, ReportParams } from '../../core/models/report.model';
import { ReportService } from '../../core/services/report.service';
import { MachineService } from '../../core/services/machine.service';
import { Machine } from '../../core/models/machine.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatTableModule, MatProgressBarModule,
    MatDatepickerModule, MatNativeDateModule, MatSnackBarModule, MatCheckboxModule,
    BaseChartDirective
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  machines: Machine[] = [];
  machinesFailed = false;
  reportData: ReportData | null = null;
  loading = false;
  reportFailed = false;

  params: ReportParams = {
    dateFrom: new Date(Date.now() - 7 * 86400000),
    dateTo: new Date(),
    machineIds: [],
    metrics: ['output', 'uptime', 'temperature'],
    groupBy: 'day',
  };

  barChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: {
      x: { ticks: { font: { size: 11 } }, grid: { color: '#F0F0F0' } },
      y: { ticks: { font: { size: 11 } }, grid: { color: '#F0F0F0' } }
    }
  };

  breakdownColumns = ['machineName', 'totalOutput', 'uptimePercent', 'downtimeHours', 'errorCount', 'efficiency'];

  constructor(
    private reportService: ReportService,
    private machineService: MachineService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Take the machine list once it has settled — the report must not
    // regenerate on every live WebSocket tick. An empty list is a valid
    // settled result, so it must not block the report either.
    this.machineService.getState().pipe(
      filter(state => state.status !== 'loading'),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(state => {
      this.machines = state.status === 'loaded' ? state.machines : [];
      this.machinesFailed = state.status === 'error';
      this.generate();
    });
  }

  generate(): void {
    this.loading = true;
    this.reportFailed = false;
    this.reportService.generate(this.params).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        this.reportData = data;
        this.buildChart(data);
        this.loading = false;
      },
      error: () => {
        // Must reset, or the progress bar stays up and the retry button
        // ([disabled]="loading") is disabled forever.
        this.loading = false;
        this.reportFailed = true;
        this.snack.open('Не удалось сформировать отчёт. Попробуйте ещё раз.', 'OK', { duration: 5000 });
      },
    });
  }

  exportPdf(): void {
    this.snack.open('Экспорт в PDF будет доступен в версии 2.0', 'OK', { duration: 3000 });
  }

  private buildChart(data: ReportData): void {
    const labels = data.timeSeries.map(p => this.formatDate(p.timestamp));
    this.barChartData = {
      labels,
      datasets: [
        {
          label: 'Выработка (дет.)',
          data: data.timeSeries.map(p => p.output),
          backgroundColor: 'rgba(25,118,210,0.7)',
          borderColor: '#1976D2',
          borderWidth: 1,
        }
      ]
    };
  }

  private formatDate(d: Date): string {
    return new Date(d).toLocaleDateString('ru', { month: 'short', day: 'numeric' });
  }

  toggleMachine(id: string): void {
    const idx = this.params.machineIds.indexOf(id);
    if (idx >= 0) this.params.machineIds.splice(idx, 1);
    else this.params.machineIds.push(id);
  }

  isMachineSelected(id: string): boolean {
    return this.params.machineIds.includes(id);
  }
}
