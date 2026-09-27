import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Machine, MachineStatus } from '../../../../core/models/machine.model';
import { MachineService } from '../../../../core/services/machine.service';

/** Manager/admin only — gated by *roleVisible on the parent template. */
@Component({
  selector: 'app-machine-controls',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSnackBarModule,
  ],
  templateUrl: './machine-controls.component.html',
  styleUrls: ['./machine-controls.component.scss'],
})
export class MachineControlsComponent implements OnChanges {
  @Input({ required: true }) machine!: Machine;

  readonly MachineStatus = MachineStatus;
  reason = '';
  maintenanceDate: Date | null = null;
  busy = false;

  constructor(private machineService: MachineService, private snack: MatSnackBar) {}

  ngOnChanges(): void {
    this.maintenanceDate = this.machine.nextMaintenanceAt ? new Date(this.machine.nextMaintenanceAt) : null;
  }

  get isStopped(): boolean {
    return this.machine.status === MachineStatus.MAINTENANCE || this.machine.status === MachineStatus.OFFLINE;
  }

  stop(status: MachineStatus.MAINTENANCE | MachineStatus.OFFLINE): void {
    this.busy = true;
    this.machineService.updateStatus(this.machine.id, status, this.reason || undefined).subscribe({
      next: () => {
        this.busy = false;
        this.reason = '';
        this.snack.open('Статус станка обновлён', '', { duration: 2000 });
      },
      error: () => {
        this.busy = false;
        this.snack.open('Не удалось изменить статус станка', '', { duration: 3000 });
      },
    });
  }

  resume(): void {
    this.busy = true;
    this.machineService.updateStatus(this.machine.id, MachineStatus.RUNNING).subscribe({
      next: () => {
        this.busy = false;
        this.snack.open('Станок возвращён в работу', '', { duration: 2000 });
      },
      error: () => {
        this.busy = false;
        this.snack.open('Не удалось вернуть станок в работу', '', { duration: 3000 });
      },
    });
  }

  saveMaintenanceDate(): void {
    const iso = this.maintenanceDate ? this.maintenanceDate.toISOString() : null;
    this.busy = true;
    this.machineService.updateMaintenanceSchedule(this.machine.id, iso).subscribe({
      next: () => {
        this.busy = false;
        this.snack.open('Дата планового ТО сохранена', '', { duration: 2000 });
      },
      error: () => {
        this.busy = false;
        this.snack.open('Не удалось сохранить дату ТО', '', { duration: 3000 });
      },
    });
  }

  clearMaintenanceDate(): void {
    this.maintenanceDate = null;
    this.saveMaintenanceDate();
  }
}
