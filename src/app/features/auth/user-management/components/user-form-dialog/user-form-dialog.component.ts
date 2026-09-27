import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { User, UserRole } from '../../../../../core/models/user.model';
import { Machine } from '../../../../../core/models/machine.model';
import { MachineService } from '../../../../../core/services/machine.service';
import { UserService } from '../../../../../core/services/user.service';

export interface UserFormDialogData {
  /** Absent for "create", present for "edit". */
  user?: User;
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
  ],
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss'],
})
export class UserFormDialogComponent implements OnInit {
  readonly UserRole = UserRole;
  readonly isEdit: boolean;
  private readonly editingId?: string;

  name = '';
  email = '';
  password = '';
  role: UserRole = UserRole.OPERATOR;
  assignedMachines: string[] = [];

  machines: Machine[] = [];
  saving = false;
  error = '';

  constructor(
    public dialogRef: MatDialogRef<UserFormDialogComponent, User>,
    @Inject(MAT_DIALOG_DATA) public data: UserFormDialogData,
    private machineService: MachineService,
    private userService: UserService
  ) {
    this.isEdit = !!data.user;
    this.editingId = data.user?.id;
    if (data.user) {
      this.name = data.user.name;
      this.email = data.user.email;
      this.role = data.user.role;
      this.assignedMachines = data.user.assignedMachines ?? [];
    }
  }

  ngOnInit(): void {
    this.machineService.getState().subscribe((s) => {
      if (s.status === 'loaded') this.machines = s.machines;
    });
  }

  get canSubmit(): boolean {
    if (!this.name.trim() || !this.email.trim()) return false;
    if (!this.isEdit && this.password.length < 6) return false;
    if (this.isEdit && this.password && this.password.length < 6) return false;
    return true;
  }

  /** Kept open on failure (with the entered data intact) instead of
   * closing and reporting the error via a toast — the whole point of
   * doing the save here is not to lose what the admin just typed. */
  submit(): void {
    if (!this.canSubmit || this.saving) return;
    this.error = '';
    this.saving = true;

    const assignedMachines = this.role === UserRole.OPERATOR ? this.assignedMachines : [];
    const request$ = this.isEdit
      ? this.userService.update(this.editingId!, {
          name: this.name.trim(),
          email: this.email.trim(),
          role: this.role,
          assignedMachines,
          ...(this.password ? { password: this.password } : {}),
        })
      : this.userService.create({
          name: this.name.trim(),
          email: this.email.trim(),
          password: this.password,
          role: this.role,
          assignedMachines,
        });

    request$.subscribe({
      next: (user) => {
        this.saving = false;
        this.dialogRef.close(user);
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.error || 'Не удалось сохранить пользователя';
      },
    });
  }
}
