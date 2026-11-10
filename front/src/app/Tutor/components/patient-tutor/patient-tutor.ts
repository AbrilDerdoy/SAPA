import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { AlertaService } from '../../../Common/alerta/alerta-service';
import { PatientService } from '../../../Usuario/services/Patient/patient.service';
import {
  Tutor,
  TutorInvitation,
} from '../../models/tutor.model';
import { TutorService } from '../../services/tutor.service';

@Component({
  selector: 'app-patient-tutor',
  imports: [DatePipe],
  templateUrl: './patient-tutor.html',
  styleUrl: './patient-tutor.css',
})
export class PatientTutor implements OnInit {
  private readonly tutorService = inject(TutorService);
  private readonly patientService = inject(PatientService);
  private readonly alerta = inject(AlertaService);

  readonly tutor = signal<Tutor | null>(null);
  readonly receivedInvitations = signal<TutorInvitation[]>([]);
  readonly sentInvitations = signal<TutorInvitation[]>([]);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly busy = signal<string | null>(null);

  readonly inviteEmail = signal('');
  readonly inviting = signal(false);

  private patientId: number | null = null;

  ngOnInit(): void {
    this.loadSection();
  }

  loadSection(): void {
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      patient: this.patientService.getMyProfile(),
      tutor: this.tutorService.getMyTutor(),
      received: this.tutorService.getReceivedInvitations(),
      sent: this.tutorService.getSentInvitations(),
    }).subscribe({
      next: ({ patient, tutor, received, sent }) => {
        this.patientId = patient.patientId;
        this.tutor.set(tutor);
        this.receivedInvitations.set(received ?? []);
        this.sentInvitations.set(sent ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('No se pudo cargar la información de tutela.');
        this.loading.set(false);
      },
    });
  }

  updateInviteEmail(event: Event): void {
    const input = event.target;

    if (input instanceof HTMLInputElement) {
      this.inviteEmail.set(input.value);
    }
  }

  sendInvitation(event: Event): void {
    event.preventDefault();

    const email = this.inviteEmail().trim();

    if (!email || this.inviting()) {
      return;
    }

    this.inviting.set(true);
    this.actionError.set(null);

    this.tutorService.createInvitation(email).subscribe({
      next: () => {
        this.inviting.set(false);
        this.inviteEmail.set('');
        this.alerta.mostrarInfo(
          'La invitación fue enviada por correo electrónico.',
          'Invitación enviada',
        );
        this.reloadInvitations();
      },
      error: (error) => {
        this.inviting.set(false);
        this.actionError.set(this.extractError(error));
      },
    });
  }

  acceptInvitation(invitation: TutorInvitation): void {
    this.runAction(
      `invitation-${invitation.id}`,
      this.tutorService.acceptInvitation(invitation.token),
      'Invitación aceptada. Tu tutor quedó vinculado.',
      true,
    );
  }

  rejectInvitation(invitation: TutorInvitation): void {
    if (!confirm('¿Rechazar esta invitación de tutela?')) {
      return;
    }

    this.runAction(
      `invitation-${invitation.id}`,
      this.tutorService.rejectInvitation(invitation.token),
      'La invitación fue rechazada.',
      true,
    );
  }

  cancelInvitation(invitation: TutorInvitation): void {
    if (!confirm('¿Cancelar esta invitación de tutela?')) {
      return;
    }

    this.runAction(
      `invitation-${invitation.id}`,
      this.tutorService.cancelInvitation(invitation.id),
      'La invitación fue cancelada.',
      true,
    );
  }

  revokeTutor(): void {
    if (this.patientId === null) {
      return;
    }

    if (!confirm('¿Revocar el vínculo con tu tutor actual?')) {
      return;
    }

    this.runAction(
      'revoke',
      this.tutorService.revokeLink(this.patientId),
      'El vínculo con tu tutor fue revocado.',
      true,
    );
  }

  private runAction(
    key: string,
    request: Observable<unknown>,
    successMessage: string,
    reload: boolean,
  ): void {
    this.busy.set(key);
    this.actionError.set(null);

    request.subscribe({
      next: () => {
        this.busy.set(null);
        this.alerta.mostrarInfo(successMessage, 'Tutela');

        if (reload) {
          this.loadSection();
        }
      },
      error: (error) => {
        this.busy.set(null);
        this.actionError.set(this.extractError(error));
      },
    });
  }

  private reloadInvitations(): void {
    forkJoin({
      tutor: this.tutorService.getMyTutor(),
      received: this.tutorService.getReceivedInvitations(),
      sent: this.tutorService.getSentInvitations(),
    }).subscribe({
      next: ({ tutor, received, sent }) => {
        this.tutor.set(tutor);
        this.receivedInvitations.set(received ?? []);
        this.sentInvitations.set(sent ?? []);
      },
      error: () => {
        this.actionError.set('No se pudieron actualizar las invitaciones.');
      },
    });
  }

  getTutorName(tutor: Tutor): string {
    return `${tutor.firstName} ${tutor.lastName}`;
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

    return 'No se pudo completar la operación. Intentá nuevamente.';
  }
}
