import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category, Website } from '../../core/models/models';
import { ModalComponent } from '../../shared/components/modal.component';

const URL_PATTERN = /^https?:\/\/.+/i;

@Component({
  selector: 'app-website-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <app-modal [title]="website ? 'Editar sitio' : 'Nuevo sitio'" (close)="close.emit()">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="space-y-4">
          <div>
            <label class="label">Nombre</label>
            <input class="input" type="text" formControlName="name" placeholder="Ej. GitHub" />
            <p *ngIf="showError('name', 'required')" class="mt-1 text-xs text-red-600">El nombre es obligatorio.</p>
            <p *ngIf="showError('name', 'maxlength')" class="mt-1 text-xs text-red-600">Máximo 120 caracteres.</p>
          </div>

          <div>
            <label class="label">URL</label>
            <input class="input" type="text" formControlName="url" placeholder="https://..." />
            <p *ngIf="showError('url', 'required')" class="mt-1 text-xs text-red-600">La URL es obligatoria.</p>
            <p *ngIf="showError('url', 'pattern')" class="mt-1 text-xs text-red-600">Debe comenzar por http:// o https://.</p>
          </div>

          <div>
            <label class="label">Descripción</label>
            <textarea class="input" rows="3" formControlName="description" placeholder="Opcional"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Categoría</label>
              <select class="input" formControlName="category_id">
                <option [ngValue]="null" disabled>Selecciona…</option>
                <option *ngFor="let c of categories" [ngValue]="c.id">{{ c.name }}</option>
              </select>
              <p *ngIf="showError('category_id', 'required')" class="mt-1 text-xs text-red-600">Selecciona una categoría.</p>
            </div>
            <div class="flex items-end pb-1">
              <label class="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" formControlName="is_favorite" class="h-4 w-4 rounded border-slate-300" />
                Favorito
              </label>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button type="button" class="btn-secondary" (click)="close.emit()">Cancelar</button>
          <button type="submit" class="btn-primary" [disabled]="saving">
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>
    </app-modal>
  `
})
export class WebsiteFormComponent {
  @Input() website: Website | null = null;
  @Input() categories: Category[] = [];
  @Input() saving = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<Website>>();

  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    url: ['', [Validators.required, Validators.pattern(URL_PATTERN), Validators.maxLength(2048)]],
    description: ['', [Validators.maxLength(2000)]],
    category_id: [null as number | null, Validators.required],
    is_favorite: [false]
  });

  ngOnInit(): void {
    if (this.website) {
      this.form.patchValue({
        name: this.website.name,
        url: this.website.url,
        description: this.website.description ?? '',
        category_id: this.website.category_id,
        is_favorite: this.website.is_favorite
      });
    }
  }

  showError(control: string, error: string): boolean {
    const c = this.form.get(control);
    return !!c && c.hasError(error) && (c.touched || c.dirty);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.value as Partial<Website>);
  }
}