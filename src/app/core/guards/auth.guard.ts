import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AuthGuard — Protects routes that require authentication.
 *
 * Any route using `canActivate: [AuthGuard]` will be checked
 * to ensure the user is logged in before granting access.
 *
 * - Not logged in : redirect to /auth/login
 * - Logged in     : allow navigation to the requested route
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  /**
   * Check whether the user is allowed to access the route.
   *
   * @returns boolean — true if authenticated, false (+ redirect) if not
   */
  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    }

    // Redirect to login page if the user is not authenticated
    this.router.navigate(['/auth/login']);
    return false;
  }
}
