import { Component } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300">
        <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <h3 class="mt-4 text-base font-medium text-slate-800">{{ title }}</h3>
      <p class="mt-1 text-sm text-slate-500">{{ description }}</p>
      <ng-content />
    </div>
  `
})
export class EmptyStateComponent {
  title = 'No hay elementos';
  description = 'No se encontraron resultados.';
}