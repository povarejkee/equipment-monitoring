import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Machine, MachineStatus } from '../../../../core/models/machine.model';
import { MachineCardComponent } from '../machine-card/machine-card.component';

@Component({
  selector: 'app-machine-grid',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatButtonModule,
    MachineCardComponent
  ],
  templateUrl: './machine-grid.component.html',
  styleUrls: ['./machine-grid.component.scss']
})
export class MachineGridComponent implements OnChanges {
  @Input() machines: Machine[] = [];

  searchQuery = '';
  selectedLocation = '';
  selectedStatus = '';

  filtered: Machine[] = [];

  readonly statusOptions = [
    { value: MachineStatus.RUNNING, label: 'Работает' },
    { value: MachineStatus.WARNING, label: 'Предупреждение' },
    { value: MachineStatus.ERROR, label: 'Ошибка' },
    { value: MachineStatus.IDLE, label: 'Простой' },
    { value: MachineStatus.MAINTENANCE, label: 'Обслуживание' },
    { value: MachineStatus.OFFLINE, label: 'Нет связи' },
  ];

  get locations(): string[] {
    return [...new Set(this.machines.map(m => m.location))].sort();
  }

  ngOnChanges(): void { this.applyFilters(); }

  applyFilters(): void {
    this.filtered = this.machines.filter(m => {
      const matchSearch = !this.searchQuery ||
        m.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchLocation = !this.selectedLocation || m.location === this.selectedLocation;
      const matchStatus = !this.selectedStatus || m.status === this.selectedStatus;
      return matchSearch && matchLocation && matchStatus;
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedLocation = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedLocation || this.selectedStatus);
  }
}
