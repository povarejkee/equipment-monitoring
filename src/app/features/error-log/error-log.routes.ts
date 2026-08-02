import { Routes } from '@angular/router';

export const ERROR_LOG_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./error-log.component').then(m => m.ErrorLogComponent) }
];
