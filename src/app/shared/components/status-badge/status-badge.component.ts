import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MachineStatus } from '../../../core/models/machine.model';
import { MachineStatusPipe } from '../../pipes/machine-status.pipe';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MachineStatusPipe],
  template: `
    <span class="status-badge" [class]="'status-' + status">
      <span class="status-dot"></span>
      {{ status | machineStatus }}
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }
    .status-running { background: #E8F5E9; color: #388E3C; }
    .status-warning { background: #FFF3E0; color: #E65100; }
    .status-error { background: #FFEBEE; color: #C62828; }
    .status-idle { background: #F5F5F5; color: #616161; }
    .status-maintenance { background: #E3F2FD; color: #1565C0; }
    .status-offline { background: #EEEEEE; color: #424242; }
  `]
})
export class StatusBadgeComponent {
  @Input() status: MachineStatus = MachineStatus.OFFLINE;
}
