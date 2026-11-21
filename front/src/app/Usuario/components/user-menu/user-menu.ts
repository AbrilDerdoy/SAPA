import {
  Component,
  ElementRef,
  HostListener,
  inject,
  signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';

import { Auth } from '../../services/Auth/auth';
import { ThemeService } from '../../../Theme/Service/theme-service';
import { ChatBubblePreferenceService } from '../../../Chat/services/chat-bubble-preference.service';

function readRole(): string {
  try {
    const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}');
    return String(usuario.role ?? '').toUpperCase().replace('ROLE_', '');
  } catch {
    return '';
  }
}

@Component({
  selector: 'app-user-menu',
  imports: [RouterLink],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
})
export class UserMenu {

  readonly theme = inject(ThemeService);
  readonly auth = inject(Auth);
  readonly bubblePreference = inject(ChatBubblePreferenceService);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);

  readonly role = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => readRole())
    ),
    { initialValue: readRole() }
  );

  menuAbierto = signal<boolean>(false);
  configuracionAbierta = signal<boolean>(false);

  constructor() {
    this.bubblePreference.loadPreference();
  }

  toggleMenu(): void {
    this.menuAbierto.update(valor => !valor);
    this.configuracionAbierta.set(false);
  }

  toggleConfiguracion(): void {
    this.configuracionAbierta.update(valor => !valor);
  }

  cambiarPreferenciaBurbuja(): void {
    this.bubblePreference.togglePreference();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuAbierto()) return;

    const target = event.target as Node | null;

    if (target && this.host.nativeElement.contains(target)) return;

    this.menuAbierto.set(false);
    this.configuracionAbierta.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuAbierto.set(false);
    this.configuracionAbierta.set(false);
  }
}