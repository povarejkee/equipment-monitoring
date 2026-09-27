import { Component } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationSoundService } from '../../core/services/notification-sound.service';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, AsyncPipe, MatCardModule, MatIconModule, MatButtonModule,
    MatSlideToggleModule, FormsModule, MatSnackBarModule,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  soundAlerts: boolean;
  connected$: Observable<boolean>;

  constructor(
    public auth: AuthService,
    private soundService: NotificationSoundService,
    ws: WebSocketService,
    private snack: MatSnackBar
  ) {
    this.soundAlerts = this.soundService.enabled;
    this.connected$ = ws.connected$;
  }

  onSoundToggle(): void {
    this.soundService.enabled = this.soundAlerts;
    this.snack.open(this.soundAlerts ? 'Звуковые уведомления включены' : 'Звуковые уведомления выключены', '', { duration: 2000 });
  }

  testSound(): void {
    this.soundService.play(true);
  }
}
