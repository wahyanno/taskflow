import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * JwtInterceptor - HTTP Interceptor untuk inject JWT token
 *
 * Setiap HTTP request yang keluar dari Angular akan:
 * 1. Di-intercept oleh class ini
 * 2. Jika user sudah login, header 'Authorization: Bearer {token}' ditambahkan
 * 3. Jika response 401 (Unauthorized), user diredirect ke halaman login
 *
 * Interceptor ini di-register di app.module.ts > providers.
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Intercept setiap HTTP request
   *
   * @param request - Request HTTP yang akan dikirim
   * @param next - Handler untuk meneruskan request
   * @returns Observable<HttpEvent<any>>
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ambil token dari localStorage
    const token = this.authService.getToken();

    // Jika token ada, clone request dan tambahkan Authorization header
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Teruskan request dan tangani error
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Jika API mengembalikan 401 (Unauthorized / token expired)
        // Logout user dan redirect ke login
        if (error.status === 401) {
          this.authService.logout();
        }

        return throwError(() => error);
      })
    );
  }
}
