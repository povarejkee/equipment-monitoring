import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, throwError } from 'rxjs';
import { User, UserRole, AuthState } from '../models/user.model';
import { environment } from '../../../environments/environment';

interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'em_token';
  private readonly USER_KEY = 'em_user';

  readonly authState = signal<AuthState>({ user: null, token: null, isAuthenticated: false });

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  get currentUser(): User | null {
    return this.authState().user;
  }

  get token(): string | null {
    return this.authState().token;
  }

  get isAuthenticated(): boolean {
    return this.authState().isAuthenticated;
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      map((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.authState.set({ user: res.user, token: res.token, isAuthenticated: true });
        return res.user;
      }),
      catchError((err) => {
        const message = err?.error?.error ?? 'Неверный email или пароль';
        return throwError(() => new Error(message));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.authState.set({ user: null, token: null, isAuthenticated: false });
    this.router.navigate(['/login']);
  }

  hasRole(role: UserRole | UserRole[]): boolean {
    const user = this.currentUser;
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }

  canAccessMachine(machineId: string): boolean {
    const user = this.currentUser;
    if (!user) return false;
    if (user.role !== UserRole.OPERATOR) return true;
    return user.assignedMachines?.includes(machineId) ?? false;
  }

  private restoreSession(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.authState.set({ user, token, isAuthenticated: true });
      } catch {
        this.logout();
      }
    }
  }
}
