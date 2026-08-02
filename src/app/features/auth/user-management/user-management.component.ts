import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { User, UserRole } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule, MatChipsModule, MatCardModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  displayedColumns = ['name', 'email', 'role', 'machines'];

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

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getAll().subscribe((users) => this.users = users);
  }

  getRoleLabel(role: string): string { return this.roleLabels[role as UserRole] ?? role; }
  getRoleColor(role: string): string { return this.roleColors[role as UserRole] ?? ''; }
}
