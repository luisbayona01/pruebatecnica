import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      <div
        *ngFor="let t of toastService.toasts()"
        class="flex items-start gap-3 rounded-lg border p-3 shadow-lg text-sm"
        [class.bg-green-50]="t.type === 'success'"
        [class.border-green-200]="t.type === 'success'"
        [class.text-green-800]="t.type === 'success'"
        [class.bg-red-50]="t.type === 'error'"
        [class.border-red-200]="t.type === 'error'"
        [class.text-red-800]="t.type === 'error'"
        [class.bg-brand-50]="t.type === 'info'"
        [class.border-brand-200]="t.type === 'info'"
        [class.text-brand-800]="t.type === 'info'"
      >
        <span class="flex-1">{{ t.message }}</span>
        <button class="text-current opacity-60 hover:opacity-100" (click)="toastService.dismiss(t.id)">✕</button>
      </div>
    </div>
  `
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}