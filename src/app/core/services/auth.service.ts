import { Injectable, Injector, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, throwError } from 'rxjs';
import { User, UserRole, AuthState } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { WebSocketService } from './websocket.service';
import { MachineService } from './machine.service';
import { AlertService } from './alert.service';

interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'em_token';
  private readonly USER_KEY = 'em_user';

  readonly authState = signal<AuthState>({ user: null, token: null, isAuthenticated: false });

  constructor(private http: HttpClient, private router: Router, private injector: Injector) {
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

  /**
   * Idempotent: N parallel 401s all land here, but only the first one that
   * actually had a session to tear down does anything.
   */
  logout(): void {
    const hadSession = this.isAuthenticated || localStorage.getItem(this.TOKEN_KEY) !== null;

    if (hadSession) {
      // Invalidate the session server-side too — previously this only
      // cleared local state, so a token copied before logout (or just
      // never actually revoked) stayed valid on the server for its full
      // 24h TTL. Must fire before the state clear below: authInterceptor
      // attaches the Authorization header by reading current authState,
      // so clearing first would send this request with no token and the
      // (auth-protected) endpoint would 401 instead of revoking anything.
      // Best-effort — local cleanup happens unconditionally either way,
      // and a failure here (offline, already expired) changes nothing
      // from the client's perspective.
      this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({ error: () => {} });
    }

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.authState.set({ user: null, token: null, isAuthenticated: false });

    // Close the live socket and drop every cached snapshot, so the next user
    // never inherits this one's machines/alerts.
    this.injector.get(WebSocketService).disconnect();
    this.injector.get(MachineService).reset();
    this.injector.get(AlertService).reset();

    if (hadSession) this.router.navigate(['/login']);
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
    if (!token || !userStr) return;

    let user: User;
    try {
      user = JSON.parse(userStr) as User;
    } catch {
      this.logout();
      return;
    }
    // Optimistic so guards resolve without a round-trip, but not trusted:
    // the stored token may be expired or revoked, so ask the server.
    this.authState.set({ user, token, isAuthenticated: true });
    // Deferred — issuing the request from the constructor would re-enter
    // AuthService through authInterceptor while it is still being built.
    queueMicrotask(() => this.validateSession());
  }

  /** Confirms the restored token is still valid; drops the session if it isn't. */
  private validateSession(): void {
    this.http.get<User>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (user) => {
        if (!this.isAuthenticated) return;
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.authState.set({ user, token: this.token, isAuthenticated: true });
      },
      error: (err) => {
        // Only a rejection invalidates the session — a network/cold-start
        // failure must not log the user out.
        if (err?.status === 401 || err?.status === 403) this.logout();
      },
    });
  }
}
