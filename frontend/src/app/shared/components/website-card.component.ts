import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Website } from '../../core/models/models';

@Component({
  selector: 'app-website-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card p-4 flex flex-col">
      <div class="flex items-start gap-3">
        <img
          *ngIf="favicon; else fallback"
          [src]="favicon"
          alt=""
          class="h-10 w-10 shrink-0 rounded-lg object-contain bg-slate-100 p-1"
          (error)="favicon = null"
        />
        <ng-template #fallback>
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 font-semibold">
            {{ website.name.charAt(0).toUpperCase() }}
          </div>
        </ng-template>
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-semibold text-slate-900 truncate">{{ website.name }}</h3>
            <span *ngIf="website.is_favorite" class="badge bg-amber-100 text-amber-700">Favorito</span>
          </div>
          <div class="mt-1 flex items-center gap-2">
            <span class="badge bg-brand-50 text-brand-700">{{ website.category?.name }}</span>
            <span class="text-xs text-slate-400">{{ website.created_at | date: 'MMM d' }}</span>
          </div>
        </div>
      </div>

      <p *ngIf="website.description" class="mt-3 text-sm text-slate-500 line-clamp-2">{{ website.description }}</p>

      <div class="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
        <a
          class="btn-secondary flex-1 justify-center !py-1.5"
          [href]="website.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          Visitar
        </a>
        <button
          class="btn-secondary !px-2 !py-1.5"
          [class.text-amber-500]="website.is_favorite"
          (click)="toggleFavorite.emit(website)"
          [title]="website.is_favorite ? 'Quitar favorito' : 'Marcar favorito'"
        >
          &#9733;
        </button>
        <button class="btn-secondary !px-2 !py-1.5" (click)="edit.emit(website)" title="Editar">
          &#9998;
        </button>
        <button class="btn-secondary !px-2 !py-1.5 text-red-500" (click)="remove.emit(website)" title="Eliminar">
          &#10005;
        </button>
      </div>
    </div>
  `
})
export class WebsiteCardComponent {
  @Input() website!: Website;
  @Output() toggleFavorite = new EventEmitter<Website>();
  @Output() edit = new EventEmitter<Website>();
  @Output() remove = new EventEmitter<Website>();

  favicon: string | null = null;

  ngOnInit(): void {
    this.favicon = this.website.favicon;
  }
}