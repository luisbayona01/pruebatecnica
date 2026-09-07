import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Category } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CategoryService extends ApiService {
  list(): Observable<Category[]> {
    return this.http.get<{ data: Category[] }>(`${this.base}/categories`)
      .pipe(map((res) => res.data));
  }

  create(name: string): Observable<{ data: Category }> {
    return this.http.post<{ data: Category }>(`${this.base}/categories`, { name });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/categories/${id}`);
  }
}