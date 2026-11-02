import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, RouterLinkWithHref } from '@angular/router';
import { Auth } from './Usuario/service/auth';
import { UserMenu } from './Usuario/components/user-menu/user-menu';
import { NotificationMenu } from './notifications/components/notification-menu/notification-menu';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive,RouterLinkWithHref,UserMenu,NotificationMenu],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('SAPA-FRONT');
  readonly auth = inject(Auth)

    readonly role = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('usuario') ?? '{}');
      return String(u.role ?? '').toUpperCase().replace('ROLE_', '');
    } catch {
      return '';
    }
  })();
}
