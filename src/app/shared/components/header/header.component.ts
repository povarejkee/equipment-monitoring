import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { WebSocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatMenuModule, MatBadgeModule, MatTooltipModule, AsyncPipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() menuToggle = new EventEmitter<void>();

  unreadCount$!: Observable<number>;
  /** False while the live socket is down — the dashboard otherwise
   * silently freezes on the last snapshot with no indication anything's
   * wrong (an operator could be looking at hours-old "live" metrics). */
  connected$: Observable<boolean>;

  constructor(public auth: AuthService, private alertService: AlertService, ws: WebSocketService) {
    this.unreadCount$ = this.alertService.getUnacknowledgedCount();
    this.connected$ = ws.connected$;
  }

  logout(): void {
    this.auth.logout();
  }
}
