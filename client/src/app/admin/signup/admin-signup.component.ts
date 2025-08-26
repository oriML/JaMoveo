import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { InstrumentPickerComponent } from '../../instrument-picker/instrument-picker.component';

@Component({
  selector: 'app-admin-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, InstrumentPickerComponent],
  templateUrl: './admin-signup.component.html',
  styleUrls: ['./admin-signup.component.scss'],
})
export class AdminSignupComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  public apiError: string | null = null;
  public isSubmitting = false;

  adminSignupForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    instrument: [null, Validators.required],
    secretKey: ['', Validators.required],
  });

  get username() {
    return this.adminSignupForm.get('username');
  }

  get password() {
    return this.adminSignupForm.get('password');
  }

  get instrument() {
    return this.adminSignupForm.get('instrument');
  }

  get secretKey() {
    return this.adminSignupForm.get('secretKey');
  }

  onSubmit(): void {
    if (this.adminSignupForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.apiError = null;

    this.authService
      .adminSignup(this.adminSignupForm.value as any)
      .pipe(
        finalize(() => (this.isSubmitting = false))
      )
      .subscribe({
        next: (user) => {
          this.router.navigate(['/admin/create-session']);
        },
        error: (err) => {
          this.apiError = err.error?.message || 'An unknown error occurred during admin signup.';
        },
      });
  }
}
