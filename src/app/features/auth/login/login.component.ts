import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../../core/services/auth.service';

/**
 * LoginComponent - Halaman login user
 *
 * Features:
 * - Reactive form dengan validasi client-side
 * - Error ditampilkan via SweetAlert2 (bukan alert() bawaan browser)
 * - Loading state saat request berlangsung
 * - Redirect ke /dashboard setelah login sukses
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  /** Reactive form untuk login */
  loginForm: FormGroup;

  /** State loading saat submit */
  isLoading = false;

  /** Toggle visibility password */
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Inisialisasi form dengan validasi
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Getter shortcut untuk form controls (untuk akses di template)
   */
  get email() { return this.loginForm.get('email')!; }
  get password() { return this.loginForm.get('password')!; }

  /**
   * Submit form login
   *
   * Flow:
   * 1. Validasi form client-side
   * 2. Tampilkan validasi error jika ada
   * 3. Call AuthService.login()
   * 4. Jika sukses: redirect ke /dashboard
   * 5. Jika error: tampilkan SweetAlert2 error
   */
  async onSubmit(): Promise<void> {
    // Mark semua field sebagai touched untuk trigger validasi visual
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService.login(this.email.value, this.password.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'success') {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Login gagal. Periksa email dan password Anda.';
        // Gunakan SweetAlert2, BUKAN alert() bawaan browser
        Swal.fire({
          icon: 'error',
          title: 'Login Gagal',
          text: msg,
          confirmButtonColor: '#6366f1',
        });
      }
    });
  }
}
