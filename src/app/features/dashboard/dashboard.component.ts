import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardData, User } from '../../core/models/models';
import Swal from 'sweetalert2';

/**
 * DashboardComponent — main statistics overview page (v2 — Professional)
 *
 * Displays:
 * - Dynamic greeting based on time of day + user name + role badge
 * - 4 KPI cards: Active Projects, Total Tasks, Completion Rate, Overdue Tasks
 * - Stacked bar for task status distribution
 * - Status breakdown list with percentages
 * - Overall completion progress bar
 * - Recent projects list with colored avatars, deadlines, and mini task stats
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  /** Dashboard data from API */
  dashboardData: DashboardData | null = null;

  /** Currently authenticated user */
  currentUser: User | null = null;

  /** Greeting text based on current hour */
  greeting = 'Hello';

  /** Loading state */
  isLoading = true;

  /**
   * Subject used to cancel active subscriptions on destroy.
   * Used with takeUntil(this.destroy$) to prevent memory leaks
   * when the user navigates away or logs out.
   */
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.greeting = this.buildGreeting();
    this.loadDashboard();
  }

  /**
   * Cancel all active subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Build a time-of-day greeting string.
   * - 00:00–11:59 → Good morning
   * - 12:00–16:59 → Good afternoon
   * - 17:00–23:59 → Good evening
   *
   * @returns Greeting string
   */
  buildGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  /**
   * Fetch dashboard statistics from the API.
   * Shows a SweetAlert2 toast on error.
   */
  loadDashboard(): void {
    this.isLoading = true;
    this.dashboardService.getDashboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.status === 'success') {
            this.dashboardData = response.data;
          }
        },
        error: (err) => {
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Failed to load dashboard',
            text: err.error?.message || 'An error occurred. Please refresh the page.',
            confirmButtonColor: '#6366f1',
            toast: true,
            position: 'top-end',
            timer: 4000,
            showConfirmButton: false,
          });
        }
      });
  }
}
