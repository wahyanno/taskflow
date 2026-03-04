import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from './core/services/auth.service';
import { User } from './core/models/models';

/**
 * AppComponent — Root component of the TaskFlow application.
 *
 * Responsibilities:
 * - Main layout: sidebar navigation + main content area
 * - Display the currently logged-in user in the navbar
 * - Logout confirmation using SweetAlert2
 * - Toggle sidebar for mobile responsiveness
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'TaskFlow';

  /** Observable of the currently authenticated user */
  currentUser$: Observable<User | null>;

  /** Sidebar open/closed state (for mobile) */
  isSidebarOpen = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void { }

  /**
   * Show a SweetAlert2 confirmation dialog before logging out.
   * Uses a modal — does NOT use the browser's built-in confirm().
   */
  async confirmLogout(): Promise<void> {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to sign out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      this.authService.logout();
    }
  }

  /**
   * Toggle the sidebar for mobile view.
   */
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /**
   * Check if the user is on an auth page (login / register) or the landing page.
   * When true, the sidebar and navbar are hidden — the page shows its own layout.
   */
  get isAuthPage(): boolean {
    return this.router.url.startsWith('/auth') || this.router.url === '/';
  }
}
