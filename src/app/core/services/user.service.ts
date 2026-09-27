import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  assignedMachines?: string[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  /** Omit (or empty) to leave the password unchanged. */
  password?: string;
  role?: UserRole;
  assignedMachines?: string[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}/users`).pipe(
      tap((users) => this.usersSubject.next(users))
    );
  }

  /** Admin only — enforced server-side; the create/edit/delete UI is
   * hidden for non-admins, but the backend is the actual guard. */
  create(req: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/users`, req).pipe(
      tap((created) => this.usersSubject.next([...this.usersSubject.value, created]))
    );
  }

  update(id: string, req: UpdateUserRequest): Observable<User> {
    const body: UpdateUserRequest = { ...req };
    if (!body.password) delete body.password; // don't send an empty password as "change it to blank"
    return this.http.put<User>(`${environment.apiUrl}/users/${id}`, body).pipe(
      tap((updated) => this.usersSubject.next(this.usersSubject.value.map((u) => (u.id === id ? updated : u))))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/users/${id}`).pipe(
      tap(() => this.usersSubject.next(this.usersSubject.value.filter((u) => u.id !== id)))
    );
  }
}
