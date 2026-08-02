import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { Machine, MachineStatus, MachineType } from '../../../../core/models/machine.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-machine-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatRippleModule, StatusBadgeComponent],
  templateUrl: './machine-card.component.html',
  styleUrls: ['./machine-card.component.scss']
})
export class MachineCardComponent {
  @Input() machine!: Machine;

  readonly typeLabels: Record<MachineType, string> = {
    [MachineType.CNC]: 'ЧПУ',
    [MachineType.LATHE]: 'Токарный',
    [MachineType.MILLING]: 'Фрезерный',
    [MachineType.GRINDING]: 'Шлифовальный',
    [MachineType.PRESS]: 'Пресс',
  };

  readonly typeIcons: Record<MachineType, string> = {
    [MachineType.CNC]: 'settings_suggest',
    [MachineType.LATHE]: 'rotate_right',
    [MachineType.MILLING]: 'construction',
    [MachineType.GRINDING]: 'blur_circular',
    [MachineType.PRESS]: 'compress',
  };

  get statusClass(): string { return `status-${this.machine.status}`; }
  get tempClass(): string {
    const t = this.machine.metrics.temperature;
    if (t > 95) return 'critical';
    if (t > 80) return 'warning';
    return 'normal';
  }
  get loadClass(): string {
    const l = this.machine.metrics.load;
    if (l > 95) return 'critical';
    if (l > 85) return 'warning';
    return 'normal';
  }
  get isActive(): boolean {
    return this.machine.status === MachineStatus.RUNNING || this.machine.status === MachineStatus.WARNING;
  }
}
