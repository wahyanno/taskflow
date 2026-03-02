import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AuthGuard - Melindungi route yang memerlukan autentikasi
 *
 * Route mana pun yang menggunakan canActivate: [AuthGuard]
 * akan otomatis diperiksa apakah user sudah login.
 *
 * Jika belum login: redirect ke /auth/login
 * Jika sudah login: izinkan akses ke route tersebut
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Cek apakah user boleh mengakses route
   *
   * @returns boolean | UrlTree
   */
  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    }

    // Redirect ke halaman login jika belum login
    this.router.navigate(['/auth/login']);
    return false;
  }
}
