import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: `
    <header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur px-4 md:px-8">
      <div class="md:hidden text-lg font-bold text-slate-900">LinkHub</div>
      <div class="hidden md:flex items-center gap-2 text-sm text-slate-500">
        <span class="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
        Gestor de sitios web
      </div>
      <div class="flex items-center gap-3">
        <span class="hidden sm:inline text-sm text-slate-600">{{ auth.user()?.name }}</span>
        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {{ initial }}
        </div>
        <button class="btn-secondary !py-1" (click)="logout()">Salir</button>
      </div>
    </header>
  `
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  private router = inject(Router);

  get initial(): string {
    return (this.auth.user()?.name ?? '?').charAt(0).toUpperCase();
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.auth.clear();
        this.router.navigate(['/login']);
      }
    });
  }
}