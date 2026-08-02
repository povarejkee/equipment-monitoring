import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { DowntimeEntry } from '../../../../core/models/machine.model';
import { MachineService } from '../../../../core/services/machine.service';

@Component({
  selector: 'app-downtime-log',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule],
  template: `
    <div class="section-card">
      <h3 class="section-title"><mat-icon>history</mat-icon> Лог простоев</h3>
      <table mat-table [dataSource]="downtimes" class="downtime-table">
        <ng-container matColumnDef="startTime">
          <th mat-header-cell *matHeaderCellDef>Начало</th>
          <td mat-cell *matCellDef="let row">{{ row.startTime | date:'dd.MM HH:mm' }}</td>
        </ng-container>
        <ng-container matColumnDef="endTime">
          <th mat-header-cell *matHeaderCellDef>Конец</th>
          <td mat-cell *matCellDef="let row">{{ row.endTime ? (row.endTime | date:'dd.MM HH:mm') : '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="duration">
          <th mat-header-cell *matHeaderCellDef>Длит.</th>
          <td mat-cell *matCellDef="let row">{{ row.duration ? row.duration + ' мин' : '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="reason">
          <th mat-header-cell *matHeaderCellDef>Причина</th>
          <td mat-cell *matCellDef="let row">{{ row.reason }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"></tr>
      </table>
      @if (!downtimes.length) {
        <div class="empty">Простоев не зафиксировано</div>
      }
    </div>
  `,
  styles: [`
    .section-card { background:#fff; border-radius:12px; padding:20px; box-shadow:0 1px 4px rgba(0,0,0,0.07); }
    .section-title { display:flex; align-items:center; gap:8px; font-size:16px; font-weight:600; color:#212121; margin:0 0 16px; mat-icon{font-size:18px;width:18px;height:18px;color:#9E9E9E;} }
    .downtime-table { width:100%; }
    table { font-size:13px; }
    th.mat-header-cell { color:#757575; font-size:12px; font-weight:600; }
    .empty { text-align:center; padding:24px; color:#9E9E9E; font-size:14px; }
  `]
})
export class DowntimeLogComponent implements OnInit {
  @Input() machineId!: string;
  downtimes: DowntimeEntry[] = [];
  cols = ['startTime', 'endTime', 'duration', 'reason'];

  constructor(private machineService: MachineService) {}

  ngOnInit(): void {
    if (this.machineId) {
      this.machineService.getDowntimes(this.machineId).subscribe(d => this.downtimes = d);
    }
  }
}
