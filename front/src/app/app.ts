import { Component, inject, signal } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  RouterLinkWithHref
} from '@angular/router';

import { Auth } from './Usuario/services/Auth/auth';
import { UserMenu } from './Usuario/components/user-menu/user-menu';
import { NotificationMenu } from './notifications/components/notification-menu/notification-menu';
import { ChatBubble } from './Chat/components/chat-bubble/chat-bubble';
import { DoctorQuickSearch } from './Doctor/components/doctor-quick-search/doctor-quick-search';
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    RouterLinkWithHref,
    UserMenu,
    NotificationMenu,
    ChatBubble,
    DoctorQuickSearch
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  protected readonly title = signal('SAPA-FRONT');
  readonly roles = signal(this.readRole());

  readonly auth = inject(Auth);

  readonly role = (() => {
    try {
      const user = JSON.parse(
        localStorage.getItem('usuario') ?? '{}'
      );

      return String(user.role ?? '')
        .toUpperCase()
        .replace('ROLE_', '');

    } catch {
      return '';
    }
  })();

  private readRole(): string {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}');
      return String(usuario.role ?? '').toUpperCase().replace('ROLE_', '');
    } catch {
      return '';
    }
  }
}
