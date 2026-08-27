import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ErrorLogEntry, ErrorType } from '../../core/models/error-log.model';
import { ErrorLogService } from '../../core/services/error-log.service';
import { ErrorDetailDialogComponent } from './components/error-detail-dialog/error-detail-dialog.component';

const TYPE_LABELS: Record<ErrorType, string> = {
  emergency_stop: 'Аварийный останов',
  overheating: 'Перегрев',
  mechanical_failure: 'Мех. неисправность',
  electrical_fault: 'Электрич. сбой',
  sensor_failure: 'Отказ датчика',
  communication_lost: 'Потеря связи',
  software_error: 'Прогр. ошибка',
};

@Component({
  selector: 'app-error-log',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatSortModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatDialogModule, MatTooltipModule
  ],
  templateUrl: './error-log.component.html',
  styleUrls: ['./error-log.component.scss']
})
export class ErrorLogComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<ErrorLogEntry>();
  displayedColumns = ['timestamp', 'machineName', 'errorCode', 'errorType', 'description', 'status', 'duration'];

  filterStatus = '';
  filterType = '';
  filterMachine = '';
  /** Distinct from "no rows match the filters" — a failed request must not
   * read as "no errors, everything's fine" on a safety-monitoring page. */
  loadFailed = false;

  readonly typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
  machines: string[] = [];
  typeLabels = TYPE_LABELS;

  constructor(private errorLogService: ErrorLogService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.errorLogService.getAll().subscribe({
      next: entries => {
        this.loadFailed = false;
        this.dataSource.data = entries;
        this.machines = [...new Set(entries.map(e => e.machineName))].sort();
        setTimeout(() => {
          this.dataSource.sort = this.sort;
          this.dataSource.paginator = this.paginator;
          this.applyFilters();
        });
      },
      error: () => { this.loadFailed = true; },
    });

    this.dataSource.filterPredicate = (row, filter) => {
      const f = JSON.parse(filter);
      const matchStatus = !f.status ||
        (f.status === 'active' && !row.resolvedAt) ||
        (f.status === 'resolved' && !!row.resolvedAt);
      const matchType = !f.type || row.errorType === f.type;
      const matchMachine = !f.machine || row.machineName === f.machine;
      return matchStatus && matchType && matchMachine;
    };
  }

  applyFilters(): void {
    this.dataSource.filter = JSON.stringify({
      status: this.filterStatus,
      type: this.filterType,
      machine: this.filterMachine,
    });
  }

  clearFilters(): void {
    this.filterStatus = '';
    this.filterType = '';
    this.filterMachine = '';
    this.applyFilters();
  }

  openDetail(entry: ErrorLogEntry): void {
    this.dialog.open(ErrorDetailDialogComponent, {
      data: entry,
      width: '520px',
      panelClass: 'detail-dialog'
    });
  }

  getTypeLabel(type: string): string { return TYPE_LABELS[type as ErrorType] ?? type; }

  /** RFC4180-style quoting: wrap any field containing the delimiter, a
   * quote, or a newline, and double up embedded quotes. Free-text fields
   * like `description`/`impact` come straight from the backend and can
   * contain any of those — without this, one semicolon in a description
   * silently shifts every following column. */
  private csvField(value: string | number): string {
    const s = String(value);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  exportCsv(): void {
    const rows = this.dataSource.filteredData;
    const headers = ['Дата', 'Станок', 'Код', 'Тип', 'Описание', 'Статус', 'Простой (мин)'];
    const csv = [
      headers.map(h => this.csvField(h)).join(';'),
      ...rows.map(r => [
        new Date(r.timestamp).toLocaleString('ru'),
        r.machineName,
        r.errorCode,
        TYPE_LABELS[r.errorType],
        r.description,
        r.resolvedAt ? 'Решена' : 'Активна',
        r.duration ?? ''
      ].map(v => this.csvField(v)).join(';'))
    ].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errors-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  get hasFilters(): boolean {
    return !!(this.filterStatus || this.filterType || this.filterMachine);
  }
}
