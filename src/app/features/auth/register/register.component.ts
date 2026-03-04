import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../../core/services/auth.service';

/**
 * RegisterComponent — New user registration page
 *
 * Features:
 * - Reactive form with validation (name, email, password)
 * - Errors displayed via SweetAlert2 toast
 * - On success: shows a success alert and redirects to login
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
   * Submit the registration form.
   *
   * Flow:
   * 1. Validate form
   * 2. Call AuthService.register()
   * 3. Success: show SweetAlert2 success dialog → redirect to login
   * 4. Error  : show SweetAlert2 error dialog
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
      next: () => {
        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'Your account has been created. Please sign in.',
          confirmButtonColor: '#6366f1',
          confirmButtonText: 'Go to Login'
        }).then(() => {
          this.router.navigate(['/auth/login']);
        });
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Registration failed. Please try again.';
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: msg,
          confirmButtonColor: '#6366f1',
        });
      }
    });
  }
}
