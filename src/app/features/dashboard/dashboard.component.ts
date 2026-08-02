import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Observable, map } from 'rxjs';
import { Machine } from '../../core/models/machine.model';
import { MachineService } from '../../core/services/machine.service';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';
import { StatsSummaryComponent } from './components/stats-summary/stats-summary.component';
import { MachineGridComponent } from './components/machine-grid/machine-grid.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AsyncPipe, StatsSummaryComponent, MachineGridComponent, LoadingSpinnerComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  machines$!: Observable<Machine[]>;

  constructor(private machineService: MachineService, private auth: AuthService) {}

  ngOnInit(): void {
    this.machines$ = this.machineService.getAll().pipe(
      map(machines => {
        const user = this.auth.currentUser;
        if (user?.role === UserRole.OPERATOR && user.assignedMachines?.length) {
          return machines.filter(m => user.assignedMachines!.includes(m.id));
        }
        return machines;
      })
    );
  }
}
