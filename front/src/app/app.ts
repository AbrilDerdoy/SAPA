import { Component, inject, effect, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, RouterLinkWithHref, NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserMenu } from './Usuario/components/user-menu/user-menu';
import { NotificationMenu } from './notifications/components/notification-menu/notification-menu';
import { ChatBubble } from './Chat/components/chat-bubble/chat-bubble';
import { DoctorQuickSearch } from './Doctor/components/doctor-quick-search/doctor-quick-search';
import { filter, map } from 'rxjs';
import { Auth } from './Usuario/services/Auth/auth';
import { FollowRequestService } from './FollowRequest/service/follow-request.service';

function readRole(): string {
  try {
    const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}');
    return String(usuario.role ?? '').toUpperCase().replace('ROLE_', '');
  } catch {
    return '';
  }
}

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

  private readonly router = inject(Router);
  private readonly followService = inject(FollowRequestService);

  protected readonly title = signal('SAPA-FRONT');
  readonly auth = inject(Auth);

  readonly role = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => readRole())
    ),
    { initialValue: readRole() }
  );

  readonly roles = signal(readRole());

  constructor() {
    effect(() => {
      this.role();
      this.followService.reset();
    });
  }
}