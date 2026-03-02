import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from './core/services/auth.service';
import { User } from './core/models/models';

/**
 * AppComponent - Root component aplikasi TaskFlow
 *
 * Menangani:
 * - Layout utama: sidebar navigation + main content area
 * - State user yang login (ditampilkan di navbar)
 * - Konfirmasi logout menggunakan SweetAlert2
 * - Toggle sidebar untuk mobile responsif
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'TaskFlow';

  /** State user yang sedang login */
  currentUser$: Observable<User | null>;

  /** State sidebar (open/closed untuk mobile) */
  isSidebarOpen = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {}

  /**
   * Konfirmasi logout dengan SweetAlert2 sebelum keluar
   * Menggunakan modal konfirmasi, bukan browser confirm() bawaan
   */
  async confirmLogout(): Promise<void> {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Anda yakin ingin keluar dari aplikasi?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Logout',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      this.authService.logout();
    }
  }

  /**
   * Toggle sidebar untuk tampilan mobile
   */
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /**
   * Cek apakah user sedang di halaman auth (login/register)
   * Jika ya, tidak tampilkan sidebar/navbar
   */
  get isAuthPage(): boolean {
    return this.router.url.startsWith('/auth');
  }
}
