import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      (click)="close.emit()"
    >
      <div class="absolute inset-0 bg-slate-900/50" aria-hidden="true"></div>
      <div
        class="relative z-10 w-full max-w-lg card p-6 max-h-[90vh] overflow-y-auto"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
          <button class="text-slate-400 hover:text-slate-600" (click)="close.emit()" aria-label="Cerrar">✕</button>
        </div>
        <ng-content />
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() title = '';
  @Output() close = new EventEmitter<void>();
}