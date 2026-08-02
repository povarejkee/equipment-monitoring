import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();

  readonly navItems: NavItem[] = [
    { label: 'Дашборд', icon: 'dashboard', route: '/dashboard' },
    { label: 'Журнал ошибок', icon: 'report_problem', route: '/errors' },
    { label: 'Отчёты', icon: 'bar_chart', route: '/reports', roles: [UserRole.MANAGER, UserRole.ADMIN] },
    { label: 'Уведомления', icon: 'notifications', route: '/notifications' },
    { label: 'Настройки', icon: 'settings', route: '/settings' },
    { label: 'Пользователи', icon: 'group', route: '/admin/users', roles: [UserRole.ADMIN] },
  ];

  constructor(public auth: AuthService) {}

  isVisible(item: NavItem): boolean {
    if (!item.roles) return true;
    return this.auth.hasRole(item.roles);
  }
}
