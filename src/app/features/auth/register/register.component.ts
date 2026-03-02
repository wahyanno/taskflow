import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../../core/services/auth.service';

/**
 * RegisterComponent - Halaman registrasi user baru
 *
 * Features:
 * - Reactive form dengan validasi (nama, email, password, konfirmasi password)
 * - Error ditampilkan via SweetAlert2
 * - Sukses tampil toast dan redirect ke login
 */
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get name() { return this.registerForm.get('name')!; }
  get email() { return this.registerForm.get('email')!; }
  get password() { return this.registerForm.get('password')!; }

  /**
   * Submit form registrasi
   *
   * Flow:
   * 1. Validasi form
   * 2. Call AuthService.register()
   * 3. Sukses: tampilkan SweetAlert2 success & redirect ke login
   * 4. Error: tampilkan SweetAlert2 error
   */
  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService.register(
      this.name.value,
      this.email.value,
      this.password.value
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: 'Registrasi Berhasil!',
          text: 'Akun Anda telah dibuat. Silakan login.',
          confirmButtonColor: '#6366f1',
          confirmButtonText: 'Login Sekarang'
        }).then(() => {
          this.router.navigate(['/auth/login']);
        });
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Registrasi gagal. Silakan coba lagi.';
        Swal.fire({
          icon: 'error',
          title: 'Registrasi Gagal',
          text: msg,
          confirmButtonColor: '#6366f1',
        });
      }
    });
  }
}
