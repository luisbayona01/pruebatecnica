import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 422 && err.error?.errors) {
        const first = Object.values<string[]>(err.error.errors)[0]?.[0];
        toast.error(first ?? 'Datos inválidos.');
      } else if (err.status === 409) {
        toast.error(err.error?.message ?? 'Conflicto con los datos actuales.');
      } else if (err.status === 404) {
        toast.error('Recurso no encontrado.');
      } else if (err.status >= 500) {
        toast.error('Error interno del servidor.');
      } else {
        toast.error(err.error?.message ?? 'Ha ocurrido un error.');
      }
      return throwError(() => err);
    })
  );
};