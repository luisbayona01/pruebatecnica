import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Statistics, Website } from '../../core/models/models';
import { DashboardService } from '../../core/services/dashboard.service';
import { CategoryService } from '../../core/services/category.service';
import { WebsiteService } from '../../core/services/website.service';
import { SkeletonCardComponent } from '../../shared/components/skeleton-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SkeletonCardComponent],
  template: `
    <div class="max-w-6xl mx-auto">
      <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p class="text-sm text-slate-500">Resumen de tu colección</p>

      <div *ngIf="loading; else content" class="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <app-skeleton-card *ngFor="let _ of [1,2,3,4]" />
      </div>

      <ng-template #content>
        <div class="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card p-5">
            <p class="text-sm text-slate-500">Sitios</p>
            <p class="mt-1 text-3xl font-bold text-slate-900">{{ stats()?.total_websites ?? 0 }}</p>
          </div>
          <div class="card p-5">
            <p class="text-sm text-slate-500">Categorías</p>
            <p class="mt-1 text-3xl font-bold text-slate-900">{{ stats()?.total_categories ?? 0 }}</p>
          </div>
          <div class="card p-5">
            <p class="text-sm text-slate-500">Favoritos</p>
            <p class="mt-1 text-3xl font-bold text-amber-500">{{ stats()?.total_favorites ?? 0 }}</p>
          </div>
          <div class="card p-5">
            <p class="text-sm text-slate-500">Categoría principal</p>
            <p class="mt-1 text-xl font-bold text-slate-900 truncate">{{ stats()?.top_category?.name ?? '—' }}</p>
            <p *ngIf="stats()?.top_category" class="text-xs text-slate-500">{{ stats()?.top_category?.count }} sitios</p>
          </div>
        </div>

        <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card p-6">
            <h2 class="font-semibold text-slate-900">Sitios por categoría</h2>
            <div class="mt-4 space-y-3">
              <ng-container *ngIf="categories().length; else noCategories">
                <div *ngFor="let c of categories()">
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-600">{{ c.name }}</span>
                    <span class="text-slate-400">{{ c.websites_count }}</span>
                  </div>
                  <div class="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      class="h-2 rounded-full bg-brand-500"
                      [style.width.%]="barWidth(c.websites_count)"
                    ></div>
                  </div>
                </div>
              </ng-container>
              <ng-template #noCategories>
                <p class="text-sm text-slate-400">No hay datos todavía.</p>
              </ng-template>
            </div>
          </div>

          <div class="card p-6">
            <h2 class="font-semibold text-slate-900">Sitios recientes</h2>
            <ul class="mt-4 divide-y divide-slate-100">
              <li *ngFor="let w of recent()" class="flex items-center gap-3 py-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-500">
                  {{ w.name.charAt(0).toUpperCase() }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-slate-800">{{ w.name }}</p>
                  <p class="truncate text-xs text-slate-400">{{ w.category?.name }}</p>
                </div>
                <a class="btn-secondary !py-1" [href]="w.url" target="_blank" rel="noopener noreferrer">Visitar</a>
              </li>
              <li *ngIf="!recent().length" class="py-3 text-sm text-slate-400">Aún no hay sitios.</li>
            </ul>
          </div>
        </div>
      </ng-template>
    </div>
  `
})
export class DashboardComponent {
  private dashboardService = inject(DashboardService);
  private categoryService = inject(CategoryService);
  private websiteService = inject(WebsiteService);

  stats = signal<Statistics | null>(null);
  categories = signal<Array<{ name: string; websites_count: number }>>([]);
  recent = signal<Website[]>([]);
  loading = true;

  ngOnInit(): void {
    this.dashboardService.statistics().subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loading = false;
      },
      error: () => (this.loading = false)
    });

    this.categoryService.list().subscribe({
      next: (c) => this.categories.set(c.map((x) => ({ name: x.name, websites_count: x.websites_count })))
    });

    this.websiteService.list({ sort: 'created_at', dir: 'desc', per_page: 8 }).subscribe({
      next: (res) => this.recent.set(res.data)
    });
  }

  barWidth(count: number): number {
    const max = Math.max(...this.categories().map((c) => c.websites_count), 1);
    return Math.max((count / max) * 100, 2);
  }
}