import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiResponse, AuthResponse, User } from '../models/models';

/**
 * AuthService - Mengelola autentikasi user
 *
 * Bertanggung jawab untuk:
 * - Login & Register via API
 * - Menyimpan JWT token ke localStorage
 * - Menyediakan informasi user yang sedang login (currentUser$)
 * - Logout (hapus token dari storage)
 * - Guard check apakah user sudah login
 *
 * Token disimpan di localStorage dengan key 'taskflow_token'.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** Key untuk menyimpan JWT token di localStorage */
  private readonly TOKEN_KEY = 'taskflow_token';
  private readonly USER_KEY = 'taskflow_user';

  /** BehaviorSubject untuk state user yang sedang login */
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Login user dengan email dan password
   *
   * Input: { email, password }
   * Output: Observable<ApiResponse<AuthResponse>>
   * Side effect: simpan token & user ke localStorage
   */
  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${environment.apiUrl}/auth/login`,
      { email, password }
    ).pipe(
      tap(response => {
        if (response.status === 'success' && response.data) {
          // Simpan token dan data user ke localStorage
          localStorage.setItem(this.TOKEN_KEY, response.data.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.data.user));
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  /**
   * Register user baru
   *
   * Input: { name, email, password }
   * Output: Observable<ApiResponse>
   */
  register(name: string, email: string, password: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.apiUrl}/auth/register`,
      { name, email, password }
    );
  }

  /**
   * Logout: hapus token dan redirect ke login
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Ambil JWT token dari localStorage
   *
   * @returns string | null - Token atau null jika belum login
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Cek apakah user sudah login (token ada di localStorage)
   *
   * @returns boolean
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Ambil user yang sedang login (dari state BehaviorSubject)
   *
   * @returns User | null
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Cek role user yang sedang login
   *
   * @param role - Role yang ingin dicek
   * @returns boolean
   */
  hasRole(role: 'admin' | 'manager' | 'member'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Helper: ambil user dari localStorage saat service diinisialisasi
   * (untuk persist login state setelah refresh)
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
