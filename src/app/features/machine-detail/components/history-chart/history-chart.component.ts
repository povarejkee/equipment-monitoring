import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartDataset } from 'chart.js';
import { MetricHistoryPoint } from '../../../../core/models/machine.model';
import { MachineService } from '../../../../core/services/machine.service';

type Period = '1h' | '6h' | '24h' | '7d' | '30d';

@Component({
  selector: 'app-history-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonToggleModule, MatCheckboxModule, BaseChartDirective],
  templateUrl: './history-chart.component.html',
  styleUrls: ['./history-chart.component.scss']
})
export class HistoryChartComponent implements OnChanges {
  @Input() machineId!: string;

  period: Period = '24h';
  showTemperature = true;
  showLoad = true;
  showOutput = false;

  chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index' }
    },
    scales: {
      x: { ticks: { maxTicksLimit: 12, font: { size: 11 } }, grid: { color: '#F0F0F0' } },
      y: { ticks: { font: { size: 11 } }, grid: { color: '#F0F0F0' } }
    },
    elements: { point: { radius: 0, hoverRadius: 4 }, line: { tension: 0.3, borderWidth: 2 } }
  };

  private history: MetricHistoryPoint[] = [];

  constructor(private machineService: MachineService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['machineId'] && this.machineId) this.loadData();
  }

  loadData(): void {
    const hoursMap: Record<Period, number> = { '1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720 };
    this.machineService.getHistory(this.machineId, hoursMap[this.period]).subscribe(pts => {
      this.history = pts;
      this.buildChart();
    });
  }

  buildChart(): void {
    const step = this.getStep();
    const sampled = this.history.filter((_, i) => i % step === 0);
    const labels = sampled.map(p => this.formatTs(p.timestamp, this.period));
    const datasets: ChartDataset[] = [];

    if (this.showTemperature) {
      datasets.push({
        label: 'Температура (°C)',
        data: sampled.map(p => p.temperature),
        borderColor: '#F44336',
        backgroundColor: 'rgba(244,67,54,0.08)',
        fill: true,
        yAxisID: 'y'
      });
    }
    if (this.showLoad) {
      datasets.push({
        label: 'Нагрузка (%)',
        data: sampled.map(p => p.load),
        borderColor: '#1976D2',
        backgroundColor: 'rgba(25,118,210,0.08)',
        fill: true,
        yAxisID: 'y'
      });
    }
    if (this.showOutput) {
      datasets.push({
        label: 'Выработка (дет./ч)',
        data: sampled.map(p => p.output),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76,175,80,0.08)',
        fill: true,
        yAxisID: 'y'
      });
    }
    this.chartData = { labels, datasets };
  }

  private getStep(): number {
    const map: Record<Period, number> = { '1h': 1, '6h': 3, '24h': 6, '7d': 12, '30d': 24 };
    return map[this.period];
  }

  private formatTs(date: Date | string, period: Period): string {
    const d = date instanceof Date ? date : new Date(date);
    if (period === '1h' || period === '6h' || period === '24h') {
      return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('ru', { month: 'short', day: 'numeric' });
  }
}
