import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const snackBar = inject(MatSnackBar);
  return next(req).pipe(
    catchError(err => {
      // Clear the session, don't just navigate — otherwise the stored token
      // survives and the restored state bounces straight back to the app.
      // logout() is idempotent, so N parallel 401s still navigate once.
      if (err.status === 401) auth.logout();
      else if (err.status === 0) snackBar.open('Нет связи с сервером. Проверьте подключение.', 'OK', { duration: 5000 });
      else if (err.status >= 500) snackBar.open('Ошибка сервера. Попробуйте позже.', 'OK', { duration: 5000 });
      return throwError(() => err);
    })
  );
};
