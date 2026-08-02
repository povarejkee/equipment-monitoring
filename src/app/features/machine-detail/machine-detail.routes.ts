import { Routes } from '@angular/router';

export const MACHINE_DETAIL_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./machine-detail.component').then(m => m.MachineDetailComponent) }
];
