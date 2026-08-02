import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user.model';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES) },
      { path: 'machines/:id', loadChildren: () => import('./features/machine-detail/machine-detail.routes').then(m => m.MACHINE_DETAIL_ROUTES) },
      { path: 'errors', loadChildren: () => import('./features/error-log/error-log.routes').then(m => m.ERROR_LOG_ROUTES) },
      { path: 'reports', canActivate: [roleGuard([UserRole.MANAGER, UserRole.ADMIN])], loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORTS_ROUTES) },
      { path: 'notifications', loadChildren: () => import('./features/notifications/notifications.routes').then(m => m.NOTIFICATIONS_ROUTES) },
      { path: 'settings', loadChildren: () => import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES) },
      { path: 'admin/users', canActivate: [roleGuard([UserRole.ADMIN])], loadComponent: () => import('./features/auth/user-management/user-management.component').then(m => m.UserManagementComponent) },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
