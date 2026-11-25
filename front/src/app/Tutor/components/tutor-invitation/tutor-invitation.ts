import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../../Usuario/services/Auth/auth';
import { TutorService } from '../../services/tutor.service';

@Component({
  selector: 'app-tutor-invitation',
  imports: [RouterLink],
  templateUrl: './tutor-invitation.html',
  styleUrl: './tutor-invitation.css',
})
export class TutorInvitation implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tutorService = inject(TutorService);

  readonly auth = inject(Auth);

  readonly token = signal<string | null>(null);
  readonly loading = signal(false);
  readonly processed = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly returnUrl = signal('/tutor-invitation');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    this.token.set(token);

    if (token) {
      this.returnUrl.set(`/tutor-invitation?token=${encodeURIComponent(token)}`);
    }

    if (!token) {
      this.error.set(
        'El enlace de invitación no contiene un token válido. Pedí una nueva invitación.',
      );
    }
  }

  accept(): void {
    this.runAction('accept');
  }

  reject(): void {
    if (!confirm('¿Rechazar esta invitación de tutela?')) {
      return;
    }

    this.runAction('reject');
  }

  private runAction(action: 'accept' | 'reject'): void {
    const token = this.token();

    if (!token || this.loading() || !this.auth.isAuthenticated()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const onSuccess = () => {
      this.loading.set(false);
      this.processed.set(true);

      if (action === 'reject') {
        this.success.set('La invitación fue rechazada correctamente.');
        return;
      }

      this.success.set('La invitación fue aceptada. El vínculo quedó activo.');

      setTimeout(() => {
        void this.router.navigate([this.auth.isTutor() ? '/tutor' : '/profile']);
      }, 900);
    };

    const onError = (error: unknown) => {
      this.loading.set(false);
      this.error.set(this.extractError(error));
    };

    if (action === 'accept') {
      this.tutorService.acceptInvitation(token).subscribe({
        next: onSuccess,
        error: onError,
      });
      return;
    }

    this.tutorService.rejectInvitation(token).subscribe({
      next: onSuccess,
      error: onError,
    });
  }

  private extractError(error: unknown): string {
    if (error && typeof error === 'object') {
      const body = Reflect.get(error, 'error');

      if (typeof body === 'string' && body.trim()) {
        return body.trim();
      }

      if (body && typeof body === 'object') {
        const message = Reflect.get(body, 'message');

        if (typeof message === 'string' && message.trim()) {
          return message.trim();
        }
      }
    }

    return 'No se pudo procesar la invitación. Intentá nuevamente.';
  }
}
