import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Website } from '../../core/models/models';
import { WebsiteService } from '../../core/services/website.service';
import { ToastService } from '../../core/services/toast.service';
import { WebsiteCardComponent } from '../../shared/components/website-card.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, WebsiteCardComponent, ConfirmDialogComponent, EmptyStateComponent],
  template: `
    <div class="max-w-5xl mx-auto">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Favoritos</h1>
        <p class="text-sm text-slate-500">Tus sitios marcados como favoritos</p>
      </div>

      <div *ngIf="websites().length; else empty" class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <app-website-card
          *ngFor="let w of websites()"
          [website]="w"
          (toggleFavorite)="toggleFav($event)"
          (remove)="delete($event)"
        />
      </div>

      <ng-template #empty>
        <div class="mt-8">
          <app-empty-state title="Sin favoritos" description="Marca sitios como favoritos para verlos aquí." />
        </div>
      </ng-template>
    </div>

    <app-confirm-dialog
      *ngIf="deleting"
      title="¿Eliminar sitio?"
      [message]="deleteMessage()"
      (confirm)="confirmDelete()"
      (cancel)="deleting = null"
    />
  `
})
export class FavoritesComponent {
  private websiteService = inject(WebsiteService);
  private toast = inject(ToastService);

  websites = signal<Website[]>([]);
  deleting: Website | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.websiteService.list({ is_favorite: true, per_page: 100 }).subscribe({
      next: (res) => this.websites.set(res.data)
    });
  }

  toggleFav(w: Website): void {
    this.websiteService.toggleFavorite(w.id).subscribe({
      next: () => {
        this.toast.info('Favorito eliminado.');
        this.load();
      }
    });
  }

  delete(w: Website): void {
    this.deleting = w;
  }

  deleteMessage(): string {
    return `Se eliminará "${this.deleting?.name}" de tu colección.`;
  }

  confirmDelete(): void {
    if (!this.deleting) return;
    this.websiteService.remove(this.deleting.id).subscribe({
      next: () => {
        this.toast.success('Sitio eliminado.');
        this.deleting = null;
        this.load();
      }
    });
  }
}