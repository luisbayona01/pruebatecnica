import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Paginated, Website, WebsiteFilters } from '../models/models';
import { HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class WebsiteService extends ApiService {
  list(filters: WebsiteFilters = {}): Observable<Paginated<Website>> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.category_id) params = params.set('category_id', filters.category_id);
    if (filters.is_favorite !== null && filters.is_favorite !== undefined) {
      params = params.set('is_favorite', filters.is_favorite ? '1' : '0');
    }
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.dir) params = params.set('dir', filters.dir);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.per_page) params = params.set('per_page', filters.per_page);

    return this.http.get<Paginated<Website>>(`${this.base}/websites`, { params });
  }

  get(id: number): Observable<{ data: Website }> {
    return this.http.get<{ data: Website }>(`${this.base}/websites/${id}`);
  }

  create(payload: Partial<Website>): Observable<{ data: Website }> {
    return this.http.post<{ data: Website }>(`${this.base}/websites`, payload);
  }

  update(id: number, payload: Partial<Website>): Observable<{ data: Website }> {
    return this.http.put<{ data: Website }>(`${this.base}/websites/${id}`, payload);
  }

  toggleFavorite(id: number): Observable<{ data: Website }> {
    return this.http.patch<{ data: Website }>(`${this.base}/websites/${id}/favorite`, {});
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/websites/${id}`);
  }

  exportUrl(format: 'csv' | 'json'): string {
    return `${this.base}/websites/export/${format}`;
  }

  import(file: File): Observable<{ data: { total: number; imported: number; errors: { row: number; message: string }[] } }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ data: { total: number; imported: number; errors: { row: number; message: string }[] } }>(
      `${this.base}/websites/import`,
      form
    );
  }

  previewUrl(url: string): Observable<{ data: { title: string | null; description: string | null; favicon: string | null; suggested_category: string | null } }> {
    return this.http.post<{ data: { title: string | null; description: string | null; favicon: string | null; suggested_category: string | null } }>(
      `${this.base}/websites/preview-url`,
      { url }
    );
  }
}