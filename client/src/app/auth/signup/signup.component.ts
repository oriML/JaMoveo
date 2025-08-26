import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth.service';
import { InstrumentPickerComponent } from '../../instrument-picker/instrument-picker.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, InstrumentPickerComponent],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  public apiError: string | null = null;
  public isSubmitting = false;

  signupForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    instrument: [null, Validators.required],
  });

  get username() {
    return this.signupForm.get('username');
  }

  get password() {
    return this.signupForm.get('password');
  }

  get instrument() {
    return this.signupForm.get('instrument');
  }

  onSubmit(): void {
    if (this.signupForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.apiError = null;

    this.authService
      .signup(this.signupForm.value as any)
      .pipe(
        finalize(() => (this.isSubmitting = false))
      )
      .subscribe({
        next: (user) => {
          this.router.navigate(['/sessions']);
        },
        error: (err) => {
          this.apiError = err.error?.message || 'An unknown error occurred.';
        },
      });
  }
}
