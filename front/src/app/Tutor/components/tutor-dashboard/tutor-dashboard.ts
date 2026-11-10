import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { AlertaService } from '../../../Common/alerta/alerta-service';
import {
  Tutor,
  TutorInvitation,
  TutorPatient,
} from '../../models/tutor.model';
import { TutorService } from '../../services/tutor.service';

@Component({
  selector: 'app-tutor-dashboard',
  imports: [DatePipe, RouterLink],
  templateUrl: './tutor-dashboard.html',
  styleUrl: './tutor-dashboard.css',
})
export class TutorDashboard implements OnInit {
  private readonly tutorService = inject(TutorService);
  private readonly alerta = inject(AlertaService);

  readonly profile = signal<Tutor | null>(null);
  readonly patients = signal<TutorPatient[]>([]);
  readonly receivedInvitations = signal<TutorInvitation[]>([]);
  readonly sentInvitations = signal<TutorInvitation[]>([]);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly inviteEmail = signal('');
  readonly inviting = signal(false);
  readonly busyInvitationId = signal<number | null>(null);
  readonly actionError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      profile: this.tutorService.getMyProfile(),
      patients: this.tutorService.getMyPatients(),
      received: this.tutorService.getReceivedInvitations(),
      sent: this.tutorService.getSentInvitations(),
    }).subscribe({
      next: ({ profile, patients, received, sent }) => {
        this.profile.set(profile);
        this.patients.set(patients ?? []);
        this.receivedInvitations.set(received ?? []);
        this.sentInvitations.set(sent ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('No se pudo cargar el panel de tutor.');
        this.loading.set(false);
      },
    });
  }

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
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
        this.inviteEmail.set('');
        this.inviting.set(false);
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
    this.runInvitationAction(
      invitation,
      this.tutorService.acceptInvitation(invitation.token),
      'Invitación aceptada. El vínculo de tutela quedó activo.',
    );
  }

  rejectInvitation(invitation: TutorInvitation): void {
    if (!confirm('¿Rechazar esta invitación de tutela?')) {
      return;
    }

    this.runInvitationAction(
      invitation,
      this.tutorService.rejectInvitation(invitation.token),
      'La invitación fue rechazada.',
    );
  }

  cancelInvitation(invitation: TutorInvitation): void {
    if (!confirm('¿Cancelar esta invitación de tutela?')) {
      return;
    }

    this.runInvitationAction(
      invitation,
      this.tutorService.cancelInvitation(invitation.id),
      'La invitación fue cancelada.',
    );
  }

  revokeLink(patient: TutorPatient): void {
    const name = `${patient.firstName} ${patient.lastName}`;

    if (!confirm(`¿Revocar el vínculo de tutela con ${name}?`)) {
      return;
    }

    this.busyInvitationId.set(patient.patientId);
    this.actionError.set(null);

    this.tutorService.revokeLink(patient.patientId).subscribe({
      next: () => {
        this.busyInvitationId.set(null);
        this.alerta.mostrarInfo(
          `El vínculo con ${name} fue revocado.`,
          'Vínculo revocado',
        );
        this.loadDashboard();
      },
      error: (error) => {
        this.busyInvitationId.set(null);
        this.actionError.set(this.extractError(error));
      },
    });
  }

  private runInvitationAction(
    invitation: TutorInvitation,
    request: Observable<unknown>,
    successMessage: string,
  ): void {
    this.busyInvitationId.set(invitation.id);
    this.actionError.set(null);

    request.subscribe({
      next: () => {
        this.busyInvitationId.set(null);
        this.alerta.mostrarInfo(successMessage, 'Tutela');
        this.loadDashboard();
      },
      error: (error) => {
        this.busyInvitationId.set(null);
        this.actionError.set(this.extractError(error));
      },
    });
  }

  private reloadInvitations(): void {
    forkJoin({
      received: this.tutorService.getReceivedInvitations(),
      sent: this.tutorService.getSentInvitations(),
    }).subscribe({
      next: ({ received, sent }) => {
        this.receivedInvitations.set(received ?? []);
        this.sentInvitations.set(sent ?? []);
      },
      error: () => {
        this.actionError.set('No se pudieron actualizar las invitaciones.');
      },
    });
  }

  getInvitationDirection(invitation: TutorInvitation): string {
    return invitation.direction === 'TUTOR_INVITES_PATIENT'
      ? 'Invitación enviada a un paciente'
      : 'Un paciente te invitó a ser su tutor';
  }

  getPatientName(patient: TutorPatient): string {
    return `${patient.firstName} ${patient.lastName}`;
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  }

  private extractError(error: unknown): string {
    if (error && typeof error === 'object') {
      const message = Reflect.get(error, 'error');

      if (typeof message === 'string' && message.trim()) {
        return message.trim();
      }

      if (message && typeof message === 'object') {
        const detail = Reflect.get(message, 'message');

        if (typeof detail === 'string' && detail.trim()) {
          return detail.trim();
        }
      }
    }

    return 'No se pudo completar la operación. Intentá nuevamente.';
  }
}
