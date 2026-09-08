import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs';
import { Category, Website } from '../../core/models/models';
import { WebsiteService } from '../../core/services/website.service';
import { CategoryService } from '../../core/services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { WebsiteCardComponent } from '../../shared/components/website-card.component';
import { WebsiteFormComponent } from '../../shared/components/website-form.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { SkeletonCardComponent } from '../../shared/components/skeleton-card.component';

interface Page {
  data: Website[];
  meta: { current_page: number; last_page: number; total: number; per_page: number };
}

@Component({
  selector: 'app-websites',
  standalone: true,
  imports: [
    CommonModule, FormsModule, WebsiteCardComponent, WebsiteFormComponent,
    ConfirmDialogComponent, PaginationComponent, EmptyStateComponent, SkeletonCardComponent
  ],
  template: `
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Sitios</h1>
          <p class="text-sm text-slate-500">Gestiona tu colección de sitios web</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary sm:hidden inline-flex" (click)="export('csv')" title="Exportar CSV">⬇ CSV</button>
          <button class="btn-secondary sm:hidden inline-flex" (click)="export('json')" title="Exportar JSON">⬇ JSON</button>
          <button class="btn-secondary hidden sm:inline-flex" (click)="export('csv')">Exportar CSV</button>
          <button class="btn-secondary hidden sm:inline-flex" (click)="export('json')">Exportar JSON</button>
          <button class="btn-secondary" (click)="fileInput.click()">Importar</button>
          <input #fileInput type="file" accept=".csv,.json" class="hidden" (change)="onImport($event)" />
          <button class="btn-primary" (click)="openCreate()">+ Nuevo sitio</button>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          class="input"
          type="search"
          placeholder="Buscar por nombre, URL o descripción…"
          [(ngModel)]="search"
          (ngModelChange)="onSearch($event)"
        />
        <select class="input" [(ngModel)]="categoryId" (ngModelChange)="reload()">
          <option [ngValue]="null">Todas las categorías</option>
          <option *ngFor="let c of categories()" [ngValue]="c.id">{{ c.name }}</option>
        </select>
        <select class="input" [(ngModel)]="favoriteFilter" (ngModelChange)="reload()">
          <option [ngValue]="null">Todos</option>
          <option [ngValue]="false">No favoritos</option>
          <option [ngValue]="true">Favoritos</option>
        </select>
        <select class="input" [(ngModel)]="sort" (ngModelChange)="reload()">
          <option value="created_at">Más recientes</option>
          <option value="name">Nombre</option>
          <option value="category_id">Categoría</option>
        </select>
      </div>

      <div *ngIf="loading(); else list" class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <app-skeleton-card *ngFor="let _ of [1,2,3,4,5,6]" />
      </div>

      <ng-template #list>
        <div *ngIf="websites().data.length; else empty" class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <app-website-card
            *ngFor="let w of websites().data"
            [website]="w"
            (toggleFavorite)="toggleFav($event)"
            (edit)="openEdit($event)"
            (remove)="askDelete($event)"
          />
        </div>
      </ng-template>

      <ng-template #empty>
        <div class="mt-8">
          <app-empty-state
            title="No hay sitios"
            description="Crea tu primer sitio o ajusta los filtros de búsqueda."
          />
        </div>
      </ng-template>

      <app-pagination
        *ngIf="websites().meta.last_page > 1"
        [currentPage]="websites().meta.current_page"
        [lastPage]="websites().meta.last_page"
        [total]="websites().meta.total"
        [perPage]="websites().meta.per_page"
        (pageChange)="onPage($event)"
      />
    </div>

    <app-website-form
      *ngIf="formOpen"
      [website]="editing"
      [categories]="categories()"
      [saving]="saving"
      (close)="closeForm()"
      (save)="saveWebsite($event)"
    />

    <app-confirm-dialog
      *ngIf="deleting"
      title="¿Eliminar sitio?"
      [message]="deleteMessage()"
      (confirm)="confirmDelete()"
      (cancel)="deleting = null"
    />

    <div *ngIf="importing()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
      <div class="card flex flex-col items-center gap-4 px-8 py-6">
        <svg class="h-10 w-10 animate-spin text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-sm font-medium text-slate-700">Importando sitios…</p>
      </div>
    </div>
  `
})
export class WebsitesComponent {
  websiteService = inject(WebsiteService);
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);

  websites = signal<Page>({ data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: 9 } });
  categories = signal<Category[]>([]);
  loading = signal(true);
  importing = signal(false);

  search = '';
  categoryId: number | null = null;
  favoriteFilter: boolean | null = null;
  sort = 'created_at';
  page = 1;
  perPage = 9;

  formOpen = false;
  editing: Website | null = null;
  saving = false;
  deleting: Website | null = null;

  ngOnInit(): void {
    this.loadCategories();
    this.reload();
  }

  loadCategories(): void {
    this.categoryService.list().subscribe({
      next: (c) => this.categories.set(c),
      error: () => {}
    });
  }

  reload(): void {
    this.loading.set(true);
    this.websiteService.list({
      search: this.search,
      category_id: this.categoryId,
      is_favorite: this.favoriteFilter,
      sort: this.sort,
      page: this.page,
      per_page: this.perPage
    }).subscribe({
      next: (res) => {
        this.websites.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(term: string): void {
    this.page = 1;
    this.reload();
  }

  onPage(page: number): void {
    this.page = page;
    this.reload();
  }

  openCreate(): void {
    this.editing = null;
    this.formOpen = true;
  }

  openEdit(w: Website): void {
    this.editing = w;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
    this.editing = null;
  }

  saveWebsite(payload: Partial<Website>): void {
    this.saving = true;
    const request = this.editing
      ? this.websiteService.update(this.editing.id, payload)
      : this.websiteService.create(payload);

    request.pipe(take(1)).subscribe({
      next: () => {
        this.toast.success(this.editing ? 'Sitio actualizado.' : 'Sitio creado.');
        this.saving = false;
        this.closeForm();
        this.reload();
      },
      error: () => (this.saving = false)
    });
  }

  toggleFav(w: Website): void {
    this.websiteService.toggleFavorite(w.id).subscribe({
      next: (res) => {
        this.toast.success(res.data.is_favorite ? 'Marcado como favorito.' : 'Favorito eliminado.');
        this.reload();
      }
    });
  }

  askDelete(w: Website): void {
    this.deleting = w;
  }

  deleteMessage(): string {
    return `Esta acción no se puede deshacer. Se eliminará "${this.deleting?.name}".`;
  }

  confirmDelete(): void {
    if (!this.deleting) return;
    this.websiteService.remove(this.deleting.id).subscribe({
      next: () => {
        this.toast.success('Sitio eliminado.');
        this.deleting = null;
        this.reload();
      }
    });
  }

  export(format: 'csv' | 'json'): void {
    this.websiteService.export(format).subscribe({
      next: ({ blob, filename }) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.toast.success(`Exportación ${format.toUpperCase()} descargada.`);
      },
      error: () => this.toast.error('No se pudo generar la exportación.'),
    });
  }

  onImport(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const validExt = /\.(csv|json)$/i.test(file.name);
    if (!validExt) {
      this.toast.error('El archivo debe ser CSV o JSON.');
      input.value = '';
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      this.toast.error('El archivo supera el límite de 50MB.');
      input.value = '';
      return;
    }

    this.importing.set(true);
    this.websiteService.import(file).subscribe({
      next: (res) => {
        const { imported, total, errors } = res.data;
        if (errors.length) {
          this.toast.info(`Importados ${imported}/${total}. ${errors.length} error(es).`);
        } else {
          this.toast.success(`Importados ${imported} sitios.`);
        }
        input.value = '';
        this.loadCategories();
        this.reload();
        this.importing.set(false);
      },
      error: (err) => {
        this.importing.set(false);
        const msg = err?.error?.message ?? 'No se pudo importar el archivo.';
        this.toast.error(msg);
        input.value = '';
      }
    });
  }
}