import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models/models';

const TOKEN_KEY = 'linkhub_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = environment.apiUrl;
  readonly user = signal<User | null>(null);

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem('linkhub_user');
    if (saved) {
      this.user.set(JSON.parse(saved));
    }
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  register(payload: { name: string; email: string; password: string; password_confirmation: string }): Observable<{ data: AuthResponse }> {
    return this.http.post<{ data: AuthResponse }>(`${this.base}/auth/register`, payload)
      .pipe(tap((res) => this.persist(res.data)));
  }

  login(payload: { email: string; password: string }): Observable<{ data: AuthResponse }> {
    return this.http.post<{ data: AuthResponse }>(`${this.base}/auth/login`, payload)
      .pipe(tap((res) => this.persist(res.data)));
  }

  me(): Observable<{ data: User }> {
    return this.http.get<{ data: User }>(`${this.base}/auth/me`);
  }

  logout(): Observable<unknown> {
    return this.http.post(`${this.base}/auth/logout`, {}).pipe(
      tap(() => this.clear())
    );
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('linkhub_user');
    this.user.set(null);
  }

  private persist(auth: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, auth.access_token);
    localStorage.setItem('linkhub_user', JSON.stringify(auth.user));
    this.user.set(auth.user);
  }
}