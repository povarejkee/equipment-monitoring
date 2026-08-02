import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MachineMetrics, MachineType } from '../../../../core/models/machine.model';

interface MetricItem {
  key: keyof MachineMetrics;
  label: string;
  unit: string;
  icon: string;
  warnThreshold?: number;
  critThreshold?: number;
  format?: string;
}

@Component({
  selector: 'app-metrics-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule],
  templateUrl: './metrics-panel.component.html',
  styleUrls: ['./metrics-panel.component.scss']
})
export class MetricsPanelComponent {
  @Input() metrics!: MachineMetrics;
  @Input() machineType!: MachineType;

  readonly allMetrics: MetricItem[] = [
    { key: 'temperature', label: 'Температура', unit: '°C', icon: 'thermostat', warnThreshold: 80, critThreshold: 95 },
    { key: 'load', label: 'Нагрузка', unit: '%', icon: 'speed', warnThreshold: 85, critThreshold: 95 },
    { key: 'output', label: 'Выработка', unit: 'дет./ч', icon: 'inventory_2' },
    { key: 'uptime', label: 'Время работы', unit: 'ч', icon: 'schedule' },
    { key: 'powerConsumption', label: 'Потребление', unit: 'кВт', icon: 'bolt' },
    { key: 'vibration', label: 'Вибрация', unit: 'мм/с', icon: 'vibration', warnThreshold: 4, critThreshold: 7 },
    { key: 'spindleSpeed', label: 'Обороты шпинделя', unit: 'об/мин', icon: 'rotate_right' },
  ];

  get visibleMetrics(): MetricItem[] {
    return this.allMetrics.filter(m => this.metrics[m.key] !== undefined);
  }

  getLevel(item: MetricItem): 'normal' | 'warning' | 'critical' {
    const val = this.metrics[item.key] as number;
    if (item.critThreshold !== undefined && val >= item.critThreshold) return 'critical';
    if (item.warnThreshold !== undefined && val >= item.warnThreshold) return 'warning';
    return 'normal';
  }

  formatValue(item: MetricItem): string {
    const val = this.metrics[item.key] as number;
    if (val === undefined || val === null) return '—';
    if (item.key === 'temperature' || item.key === 'load' || item.key === 'vibration') {
      return val.toFixed(1);
    }
    return Math.round(val).toString();
  }
}
