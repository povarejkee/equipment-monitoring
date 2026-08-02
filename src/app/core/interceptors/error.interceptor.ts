import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  return next(req).pipe(
    catchError(err => {
      if (err.status === 401) router.navigate(['/login']);
      else if (err.status >= 500) snackBar.open('Ошибка сервера. Попробуйте позже.', 'OK', { duration: 5000 });
      return throwError(() => err);
    })
  );
};
