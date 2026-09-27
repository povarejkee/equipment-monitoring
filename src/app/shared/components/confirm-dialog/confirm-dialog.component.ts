import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  /** Renders the confirm button in the "warn" (red) color — for destructive actions. */
  danger?: boolean;
}

/**
 * Generic yes/no confirmation dialog. Open with:
 *   this.dialog.open(ConfirmDialogComponent, { data: { title, message, danger: true } })
 *     .afterClosed().subscribe(confirmed => { if (confirmed) ... });
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">Отмена</button>
      <button mat-flat-button [color]="data.danger ? 'warn' : 'primary'" (click)="dialogRef.close(true)">
        {{ data.confirmLabel || 'Подтвердить' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
