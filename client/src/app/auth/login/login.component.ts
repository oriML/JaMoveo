import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, Role } from '../auth.service';
import { finalize } from 'rxjs';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  public apiError: string | null = null;
  public isSubmitting = false;

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    secretKey: [''], // New field for optional secret key
  });

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get secretKey() {
    return this.loginForm.get('secretKey');
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.apiError = null;

    const { username, password, secretKey } = this.loginForm.value;

    this.authService
      .login({ username, password, secretKey } as any)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (user) => {
          if (user.role === Role.Admin) {
            this.router.navigate(['/admin/create-session']);
          } else {
            this.router.navigate(['/sessions']);
          }
        },
        error: (err) => {
          this.apiError = err.error?.message || 'Invalid username or password.';
        },
      });
  }
}
