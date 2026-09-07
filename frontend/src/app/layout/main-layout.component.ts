import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { NavbarComponent } from './navbar.component';
import { ToastContainerComponent } from './toast-container.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent, ToastContainerComponent],
  template: `
    <div class="flex min-h-screen">
      <app-sidebar />
      <div class="flex-1 flex flex-col min-w-0">
        <app-navbar />
        <main class="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          <router-outlet />
        </main>
      </div>
      <app-toast-container />
    </div>
  `
})
export class MainLayoutComponent {}