import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const ICONS: Record<string, string> = {
  dashboard: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10"/></svg>',
  websites: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 019-9"/></svg>',
  favorites: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 10.101c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>',
  categories: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>'
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <aside class="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white">
      <div class="flex items-center gap-2 px-6 py-5 border-b border-slate-100">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">L</div>
        <span class="text-lg font-bold text-slate-900">LinkHub</span>
      </div>
      <nav class="flex-1 p-3 space-y-1">
        <a
          *ngFor="let item of items"
          [routerLink]="item.path"
          routerLinkActive="bg-brand-50 text-brand-700"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <span class="inline-flex" [innerHTML]="trust(item.icon)"></span>
          {{ item.label }}
        </a>
      </nav>
      <div class="p-4 text-xs text-slate-400 border-t border-slate-100">LinkHub · v1.0</div>
    </aside>
    <nav class="md:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around border-t border-slate-200 bg-white">
      <a
        *ngFor="let item of items"
        [routerLink]="item.path"
        routerLinkActive="text-brand-700"
        class="flex flex-col items-center gap-1 px-3 py-2 text-xs text-slate-500"
      >
        <span class="inline-flex" [innerHTML]="trust(item.icon)"></span>
        {{ item.label }}
      </a>
    </nav>
  `
})
export class SidebarComponent {
  items: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Sitios', path: '/websites', icon: 'websites' },
    { label: 'Favoritos', path: '/favorites', icon: 'favorites' },
    { label: 'Categorías', path: '/categories', icon: 'categories' }
  ];

  constructor(private sanitizer: DomSanitizer) {}

  trust(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[icon]);
  }
}