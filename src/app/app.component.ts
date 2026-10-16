import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  darkMode = true;

  toggleTheme(): void {
    this.darkMode = !this.darkMode;
  }
}
