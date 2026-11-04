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
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    RouterLinkWithHref,
    UserMenu,
    NotificationMenu,
    ChatBubble
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  protected readonly title = signal('SAPA-FRONT');

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

}
