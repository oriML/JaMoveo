import { Component, ViewChild, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild(NavbarComponent) navbarComponent!: NavbarComponent;

  isSidebarOpen: boolean = false;
  private router = inject(Router);
  shouldShowNavbar: boolean = true; // Initial state

  constructor() {
    this.router.events.pipe(
    ).subscribe((event) => {
      if(event instanceof NavigationEnd)
      this.shouldShowNavbar = !['/login', '/signup', '/admin/signup'].includes(event.urlAfterRedirects);
    });
  }

  onSidebarToggle(isOpen: boolean): void {
    this.isSidebarOpen = isOpen;
  }

  closeSidebar(): void {
    this.navbarComponent.closeSidebar();
  }
}