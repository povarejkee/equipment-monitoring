import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Machine, MachineStatus } from '../../../../core/models/machine.model';

@Component({
  selector: 'app-stats-summary',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './stats-summary.component.html',
  styleUrls: ['./stats-summary.component.scss']
})
export class StatsSummaryComponent {
  @Input() machines: Machine[] = [];

  get total() { return this.machines.length; }
  get running() { return this.machines.filter(m => m.status === MachineStatus.RUNNING).length; }
  get warning() { return this.machines.filter(m => m.status === MachineStatus.WARNING).length; }
  get error() { return this.machines.filter(m => m.status === MachineStatus.ERROR).length; }
  get idle() { return this.machines.filter(m => m.status === MachineStatus.IDLE).length; }
  get maintenance() { return this.machines.filter(m => m.status === MachineStatus.MAINTENANCE).length; }
  get offline() { return this.machines.filter(m => m.status === MachineStatus.OFFLINE).length; }

  get totalOutput() {
    return this.machines.reduce((s, m) => s + m.metrics.output, 0);
  }

  get avgLoad() {
    if (!this.machines.length) return 0;
    const running = this.machines.filter(m => m.status === MachineStatus.RUNNING || m.status === MachineStatus.WARNING);
    if (!running.length) return 0;
    return Math.round(running.reduce((s, m) => s + m.metrics.load, 0) / running.length);
  }
}
