import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiResponse, AuthResponse, User } from '../models/models';

/**
 * AuthService — manages user authentication state
 *
 * Responsibilities:
 * - Login & Register via API
 * - Persist JWT token in localStorage
 * - Expose the currently authenticated user via currentUser$ observable
 * - Logout (clear token and redirect)
 * - Guard check to verify if the user is logged in
 *
 * Token is stored in localStorage under the key 'taskflow_token'.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** localStorage keys */
  private readonly TOKEN_KEY = 'taskflow_token';
  private readonly USER_KEY = 'taskflow_user';

  /** BehaviorSubject for the currently authenticated user state */
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  /**
   * Login with email and password.
   *
   * Input  : { email, password }
   * Output : Observable<ApiResponse<AuthResponse>>
   * Side effect: saves token & user to localStorage
   */
  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${environment.apiUrl}/auth/login`,
      { email, password }
    ).pipe(
      tap(response => {
        if (response.status === 'success' && response.data) {
          localStorage.setItem(this.TOKEN_KEY, response.data.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.data.user));
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  /**
   * Register a new user.
   *
   * Input  : { name, email, password }
   * Output : Observable<ApiResponse>
   */
  register(name: string, email: string, password: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.apiUrl}/auth/register`,
      { name, email, password }
    );
  }

  /**
   * Logout: clear stored credentials and redirect to login.
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Retrieve the JWT token from localStorage.
   *
   * @returns string | null — token, or null if not logged in
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check whether the user is currently logged in (token exists).
   *
   * @returns boolean
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Get the currently authenticated user from the BehaviorSubject.
   *
   * @returns User | null
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if the current user has a specific role.
   *
   * @param role - Role to check against
   * @returns boolean
   */
  hasRole(role: 'admin' | 'manager' | 'member'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Load user from localStorage on service initialization.
   * Used to restore login state after a page refresh.
   */
  private getUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }
}
