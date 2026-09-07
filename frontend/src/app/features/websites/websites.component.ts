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
          <a class="btn-secondary hidden sm:inline-flex" [href]="websiteService.exportUrl('csv')">Exportar CSV</a>
          <a class="btn-secondary hidden sm:inline-flex" [href]="websiteService.exportUrl('json')">Exportar JSON</a>
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
  `
})
export class WebsitesComponent {
  websiteService = inject(WebsiteService);
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);

  websites = signal<Page>({ data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: 9 } });
  categories = signal<Category[]>([]);
  loading = signal(true);

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
    this.categoryService.list().subscribe({ next: (c) => this.categories.set(c), error: () => {} });
    this.reload();
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

  onImport(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.websiteService.import(file).subscribe({
      next: (res) => {
        const { imported, total, errors } = res.data;
        if (errors.length) {
          this.toast.info(`Importados ${imported}/${total}. ${errors.length} error(es).`);
        } else {
          this.toast.success(`Importados ${imported} sitios.`);
        }
        input.value = '';
        this.reload();
      },
      error: () => (input.value = '')
    });
  }
}