import { Component, Input, OnChanges } from '@angular/core';
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
export class StatsSummaryComponent implements OnChanges {
  @Input() machines: Machine[] = [];

  // Computed once per input change instead of on every template read —
  // these were getters bound directly in the template, so 7 filter passes
  // plus 2 reduces ran on every change-detection cycle (every WS tick,
  // every mousemove/scroll), not just when `machines` actually changed.
  total = 0;
  running = 0;
  warning = 0;
  error = 0;
  idle = 0;
  maintenance = 0;
  offline = 0;
  totalOutput = 0;
  avgLoad = 0;

  ngOnChanges(): void {
    this.total = this.machines.length;
    this.running = 0;
    this.warning = 0;
    this.error = 0;
    this.idle = 0;
    this.maintenance = 0;
    this.offline = 0;
    this.totalOutput = 0;

    let runningLoadSum = 0;
    let runningCount = 0;

    for (const m of this.machines) {
      switch (m.status) {
        case MachineStatus.RUNNING: this.running++; break;
        case MachineStatus.WARNING: this.warning++; break;
        case MachineStatus.ERROR: this.error++; break;
        case MachineStatus.IDLE: this.idle++; break;
        case MachineStatus.MAINTENANCE: this.maintenance++; break;
        case MachineStatus.OFFLINE: this.offline++; break;
      }
      this.totalOutput += m.metrics.output;
      if (m.status === MachineStatus.RUNNING || m.status === MachineStatus.WARNING) {
        runningLoadSum += m.metrics.load;
        runningCount++;
      }
    }

    this.avgLoad = runningCount ? Math.round(runningLoadSum / runningCount) : 0;
  }
}
