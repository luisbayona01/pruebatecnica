import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div class="w-full max-w-md">
        <div class="flex items-center gap-2 mb-8 justify-center">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">L</div>
          <span class="text-xl font-bold text-slate-900">LinkHub</span>
        </div>

        <div class="card p-8">
          <h1 class="text-xl font-semibold text-slate-900">{{ isRegister ? 'Crear cuenta' : 'Iniciar sesión' }}</h1>
          <p class="mt-1 text-sm text-slate-500">Gestiona tu colección de sitios web</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 space-y-4" novalidate>
            <div *ngIf="isRegister">
              <label class="label">Nombre</label>
              <input class="input" type="text" formControlName="name" placeholder="Tu nombre" />
            </div>

            <div>
              <label class="label">Email</label>
              <input class="input" type="email" formControlName="email" placeholder="demo@linkhub.test" />
            </div>

            <div>
              <label class="label">Contraseña</label>
              <div class="relative">
                <input class="input pr-10" [type]="showPassword ? 'text' : 'password'" formControlName="password" placeholder="••••••••" />
                <button type="button" class="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600" (click)="showPassword = !showPassword" tabindex="-1">
                  {{ showPassword ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
            </div>

            <div *ngIf="isRegister">
              <label class="label">Confirmar contraseña</label>
              <div class="relative">
                <input class="input pr-10" [type]="showPassword ? 'text' : 'password'" formControlName="password_confirmation" placeholder="••••••••" />
                <button type="button" class="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600" (click)="showPassword = !showPassword" tabindex="-1">
                  {{ showPassword ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
              <p *ngIf="form.errors?.['mismatch']" class="mt-1 text-xs text-red-600">Las contraseñas no coinciden.</p>
            </div>

            <button type="submit" class="btn-primary w-full justify-center" [disabled]="loading || form.invalid">
              {{ loading ? 'Procesando…' : (isRegister ? 'Crear cuenta' : 'Entrar') }}
            </button>
          </form>

          <div class="mt-6 text-center text-sm text-slate-500">
            {{ isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?' }}
            <button class="text-brand-600 font-medium hover:underline" (click)="isRegister = !isRegister">
              {{ isRegister ? 'Inicia sesión' : 'Crea una cuenta' }}
            </button>
          </div>

          <div *ngIf="!isRegister" class="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            Demo: <strong>demo&#64;linkhub.test</strong> / <strong>password</strong>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  isRegister = false;
  loading = false;
  showPassword = false;

  form = this.fb.group({
    name: ['', Validators.maxLength(120)],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['']
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isRegister && this.form.value.password !== this.form.value.password_confirmation) {
      this.form.setErrors({ mismatch: true });
      return;
    }

    this.loading = true;

    const observable = this.isRegister
      ? this.auth.register(this.form.value as any)
      : this.auth.login({ email: this.form.value.email!, password: this.form.value.password! });

    observable.pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toast.success(this.isRegister ? 'Cuenta creada.' : 'Bienvenido.');
        this.router.navigate(['/dashboard']);
      },
      error: () => {}
    });
  }
}