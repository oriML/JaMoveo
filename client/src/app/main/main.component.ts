import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule],
  template: `<h2>Main Application Page (Protected)</h2>`,
})
export class MainComponent {}
