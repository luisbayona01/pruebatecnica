import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs';
import { Category } from '../../core/models/models';
import { CategoryService } from '../../core/services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalComponent } from '../../shared/components/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ConfirmDialogComponent, EmptyStateComponent],
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Categorías</h1>
          <p class="text-sm text-slate-500">Organiza tus sitios por categorías</p>
        </div>
        <button class="btn-primary" (click)="showCreate = true">+ Nueva categoría</button>
      </div>

      <div *ngIf="categories().length; else empty" class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div *ngFor="let c of categories()" class="card p-5 flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-slate-900">{{ c.name }}</h3>
            <p class="text-sm text-slate-500">{{ c.websites_count }} sitio(s)</p>
          </div>
          <button
            class="btn-secondary !px-2 !py-1.5 text-red-500"
            (click)="askDelete(c)"
            title="Eliminar categoría"
          >
            &#10005;
          </button>
        </div>
      </div>

      <ng-template #empty>
        <div class="mt-8">
          <app-empty-state title="Sin categorías" description="Crea una categoría para empezar a organizar." />
        </div>
      </ng-template>
    </div>

    <app-modal *ngIf="showCreate" title="Nueva categoría" (close)="showCreate = false">
      <div>
        <label class="label">Nombre</label>
        <input class="input" type="text" [(ngModel)]="name" placeholder="Ej. Tecnología" (keyup.enter)="create()" />
        <p *ngIf="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <button class="btn-secondary" (click)="closeCreate()">Cancelar</button>
        <button class="btn-primary" (click)="create()" [disabled]="saving">{{ saving ? 'Creando…' : 'Crear' }}</button>
      </div>
    </app-modal>

    <app-confirm-dialog
      *ngIf="deleting"
      title="¿Eliminar categoría?"
      [message]="deleteMessage()"
      (confirm)="confirmDelete()"
      (cancel)="deleting = null"
    />
  `
})
export class CategoriesComponent {
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);

  categories = signal<Category[]>([]);
  showCreate = false;
  name = '';
  error = '';
  saving = false;
  deleting: Category | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.categoryService.list().subscribe({ next: (c) => this.categories.set(c) });
  }

  create(): void {
    const value = this.name.trim();
    if (!value) {
      this.error = 'El nombre es obligatorio.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.categoryService.create(value).pipe(take(1)).subscribe({
      next: () => {
        this.toast.success('Categoría creada.');
        this.saving = false;
        this.closeCreate();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        if (err.error?.errors?.name) {
          this.error = err.error.errors.name[0];
        }
      }
    });
  }

  closeCreate(): void {
    this.showCreate = false;
    this.name = '';
    this.error = '';
  }

  askDelete(c: Category): void {
    this.deleting = c;
  }

  deleteMessage(): string {
    if (!this.deleting) return '';
    const count = this.deleting.websites_count;
    return count > 0
      ? `No se puede eliminar esta categoría. Actualmente tiene ${count} sitio(s) asociados.`
      : 'Esta acción no se puede deshacer.';
  }

  confirmDelete(): void {
    if (!this.deleting) return;
    const category = this.deleting;

    this.categoryService.remove(category.id).subscribe({
      next: () => {
        this.toast.success('Categoría eliminada.');
        this.deleting = null;
        this.load();
      },
      error: () => {
        // 409 lo maneja el interceptor; cerramos el diálogo informativamente.
        this.deleting = null;
        this.load();
      }
    });
  }
}