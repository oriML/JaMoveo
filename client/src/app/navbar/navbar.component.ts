import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, Role } from '../auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  public currentUser = this.authService.currentUser;
  public isLoggedIn = this.authService.isLoggedIn;

  public isOpen = signal(false);
  @Output() sidebarToggle = new EventEmitter<boolean>();

  public get isAdmin(): boolean {
    return this.currentUser()?.role === Role.Admin;
  }

  public get isUser(): boolean {
    return this.currentUser()?.role === Role.User;
  }

  toggleSidebar(): void {
    this.isOpen.update(value => !value);
    this.sidebarToggle.emit(this.isOpen());
  }

  closeSidebar(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.sidebarToggle.emit(false);
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.closeSidebar();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        
      }
    });
  }
}