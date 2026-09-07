import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="flex items-center justify-between gap-4 py-4" *ngIf="lastPage > 1">
      <p class="text-sm text-slate-500">
        Mostrando {{ from }}–{{ to }} de {{ total }}
      </p>
      <div class="flex items-center gap-1">
        <button class="btn-secondary" [disabled]="currentPage <= 1" (click)="go(currentPage - 1)">
          Anterior
        </button>
        <ng-container *ngFor="let p of pages">
          <button
            *ngIf="p !== '...'"
            class="h-9 w-9 rounded-lg text-sm font-medium"
            [class.bg-brand-600]="p === currentPage"
            [class.text-white]="p === currentPage"
            [class.text-slate-600]="p !== currentPage"
            [class.hover:bg-slate-100]="p !== currentPage"
            (click)="go(p)"
          >
            {{ p }}
          </button>
          <span *ngIf="p === '...'" class="px-1 text-slate-400">…</span>
        </ng-container>
        <button class="btn-secondary" [disabled]="currentPage >= lastPage" (click)="go(currentPage + 1)">
          Siguiente
        </button>
      </div>
    </nav>
  `
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() lastPage = 1;
  @Input() total = 0;
  @Input() perPage = 12;
  @Output() pageChange = new EventEmitter<number>();

  get from(): number {
    return this.total === 0 ? 0 : (this.currentPage - 1) * this.perPage + 1;
  }

  get to(): number {
    return Math.min(this.currentPage * this.perPage, this.total);
  }

  get pages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const last = this.lastPage;
    const current = this.currentPage;
    const range = 1; // vecinos visibles alrededor de la página actual

    const add = (n: number) => pages.push(n);
    const addEllipsis = () => pages.push('...');

    add(1);
    if (current - range > 2) addEllipsis();
    for (let i = Math.max(2, current - range); i <= Math.min(last - 1, current + range); i++) add(i);
    if (current + range < last - 1) addEllipsis();
    if (last > 1) add(last);

    return pages;
  }

  go(page: number | string): void {
    if (typeof page === 'string') return;
    if (page >= 1 && page <= this.lastPage && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}