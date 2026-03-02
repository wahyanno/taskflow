import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardData } from '../../core/models/models';
import Swal from 'sweetalert2';

/**
 * DashboardComponent - Halaman ringkasan statistik utama
 *
 * Menampilkan:
 * - Statistik total project, task, completion rate, overdue
 * - Breakdown task per status
 * - Daftar 5 project terbaru
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  /** Data dashboard dari API */
  dashboardData: DashboardData | null = null;

  /** State loading */
  isLoading = true;

  /**
   * Subject untuk cancel subscriptions saat component destroyed.
   * Digunakan bersama takeUntil(this.destroy$) agar tidak ada API call
   * yang berjalan setelah user logout / navigasi pergi.
   */
  private destroy$ = new Subject<void>();

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.loadDashboard();
  }

  /**
   * Lifecycle hook: dipanggil saat component dihancurkan.
   * Emit destroy$ untuk cancel semua subscription aktif.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Ambil data dashboard dari API.
   * Error ditampilkan via SweetAlert2 toast.
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
            title: 'Gagal memuat dashboard',
            text: err.error?.message || 'Terjadi kesalahan. Coba refresh halaman.',
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
