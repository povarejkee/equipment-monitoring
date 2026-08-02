import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="layout-wrap">
      <app-sidebar [collapsed]="sidebarCollapsed()" (toggle)="toggleSidebar()"></app-sidebar>
      <div class="layout-main">
        <app-header (menuToggle)="toggleSidebar()"></app-header>
        <main class="layout-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-wrap {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: #F5F5F5;
    }
    .layout-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }
    .layout-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
  `]
})
export class MainLayoutComponent {
  sidebarCollapsed = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }
}
