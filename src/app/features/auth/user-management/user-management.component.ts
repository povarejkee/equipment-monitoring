import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { User, UserRole } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { RoleVisibleDirective } from '../../../shared/directives/role-visible.directive';
import { UserFormDialogComponent } from './components/user-form-dialog/user-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatCardModule, MatTooltipModule, MatDialogModule, MatSnackBarModule, RoleVisibleDirective,
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  readonly UserRole = UserRole;

  users: User[] = [];
  loadFailed = false;
  displayedColumns = ['name', 'email', 'role', 'machines', 'actions'];

  readonly roleLabels: Record<UserRole, string> = {
    [UserRole.OPERATOR]: 'Оператор',
    [UserRole.MANAGER]: 'Менеджер',
    [UserRole.ADMIN]: 'Администратор',
  };

  readonly roleColors: Record<UserRole, string> = {
    [UserRole.OPERATOR]: 'operator',
    [UserRole.MANAGER]: 'manager',
    [UserRole.ADMIN]: 'admin',
  };

  constructor(
    private userService: UserService,
    public auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.userService.getAll().subscribe({
      next: (users) => { this.users = users; this.loadFailed = false; },
      error: () => { this.loadFailed = true; },
    });
  }

  getRoleLabel(role: string): string { return this.roleLabels[role as UserRole] ?? role; }
  getRoleColor(role: string): string { return this.roleColors[role as UserRole] ?? ''; }

  openCreate(): void {
    this.dialog.open(UserFormDialogComponent, { data: {}, width: '480px' })
      .afterClosed().subscribe((created) => {
        if (created) {
          this.users = [...this.users, created];
          this.snack.open('Пользователь создан', '', { duration: 2000 });
        }
      });
  }

  openEdit(user: User): void {
    this.dialog.open(UserFormDialogComponent, { data: { user }, width: '480px' })
      .afterClosed().subscribe((updated) => {
        if (updated) {
          this.users = this.users.map((u) => (u.id === updated.id ? updated : u));
          this.snack.open('Пользователь обновлён', '', { duration: 2000 });
        }
      });
  }

  remove(user: User): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Удалить пользователя?',
        message: `${user.name} (${user.email}) будет удалён без возможности восстановления.`,
        confirmLabel: 'Удалить',
        danger: true,
      },
    }).afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.userService.delete(user.id).subscribe({
        next: () => {
          this.users = this.users.filter((u) => u.id !== user.id);
          this.snack.open('Пользователь удалён', '', { duration: 2000 });
        },
        error: (err) => {
          const message = err?.error?.error || 'Не удалось удалить пользователя';
          this.snack.open(message, '', { duration: 3000 });
        },
      });
    });
  }

  isSelf(user: User): boolean {
    return this.auth.currentUser?.id === user.id;
  }
}
