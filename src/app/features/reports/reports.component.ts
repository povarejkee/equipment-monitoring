import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

  @ViewChild(BaseChartDirective) chartDirective?: BaseChartDirective;

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
    if (!this.reportData) return;
    const data = this.reportData;
    const doc = new jsPDF();
    const marginX = 14;

    doc.setFontSize(16);
    doc.text('Отчёт по производительности оборудования', marginX, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(
      `Период: ${this.formatDateShort(data.params.dateFrom)} — ${this.formatDateShort(data.params.dateTo)}`,
      marginX, 25
    );
    doc.text(`Сформирован: ${new Date(data.generatedAt).toLocaleString('ru')}`, marginX, 30);
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 36,
      head: [['Общая выработка', 'Среднее время работы', 'Простой', 'Ошибки', 'Эффективность']],
      body: [[
        `${data.summary.totalOutput} дет.`,
        `${data.summary.avgUptime}%`,
        `${data.summary.totalDowntime} ч`,
        String(data.summary.totalErrors),
        `${data.summary.efficiency}%`,
      ]],
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210] },
      margin: { left: marginX, right: marginX },
    });

    // jspdf-autotable records the last table's end position on the doc
    // instance itself (not in the return value) — this is the documented
    // way to chain content after a table, hence the `any` cast.
    let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // JPEG at 0.85 quality instead of the PNG default: the canvas renders
    // at devicePixelRatio (often 2x+), so an uncompressed PNG export here
    // was pushing the whole PDF to several MB for one chart.
    const chartImage = this.chartDirective?.chart?.toBase64Image('image/jpeg', 0.85);
    if (chartImage) {
      doc.setFontSize(12);
      doc.text('Выработка по периодам', marginX, y);
      doc.addImage(chartImage, 'JPEG', marginX, y + 4, 180, 70);
      y += 84;
    }

    doc.setFontSize(12);
    doc.text('Разбивка по станкам', marginX, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['Станок', 'Выработка', 'Работа %', 'Простой', 'Ошибки', 'КПД %']],
      body: data.machineBreakdown.map(row => [
        row.machineName,
        `${row.totalOutput} дет.`,
        `${row.uptimePercent}%`,
        `${row.downtimeHours}ч`,
        String(row.errorCount),
        `${row.efficiency}%`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [25, 118, 210] },
      margin: { left: marginX, right: marginX },
    });

    doc.save(`report-${new Date().toISOString().slice(0, 10)}.pdf`);
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

  private formatDateShort(d: Date): string {
    return new Date(d).toLocaleDateString('ru');
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
