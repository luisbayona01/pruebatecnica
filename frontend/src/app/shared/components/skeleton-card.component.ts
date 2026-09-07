import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card p-5 animate-pulse" *ngFor="let i of items">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-lg bg-slate-200"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 w-1/2 rounded bg-slate-200"></div>
          <div class="h-3 w-2/3 rounded bg-slate-100"></div>
        </div>
      </div>
    </div>
  `
})
export class SkeletonCardComponent {
  @Input() items: number[] = Array(6).fill(0);
}