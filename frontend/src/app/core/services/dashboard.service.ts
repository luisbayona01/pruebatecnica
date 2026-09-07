import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Statistics } from '../models/models';

@Injectable({ providedIn: 'root' })
export class DashboardService extends ApiService {
  statistics(): Observable<{ data: Statistics }> {
    return this.http.get<{ data: Statistics }>(`${this.base}/dashboard/statistics`);
  }
}