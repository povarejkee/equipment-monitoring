import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatSlideToggleModule, FormsModule, MatSnackBarModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  emailNotifications = true;
  soundAlerts = false;
  autoRefresh = true;
  refreshInterval = 4;

  constructor(public auth: AuthService, private snack: MatSnackBar) {}

  save(): void {
    this.snack.open('Настройки сохранены', '', { duration: 2000 });
  }
}
