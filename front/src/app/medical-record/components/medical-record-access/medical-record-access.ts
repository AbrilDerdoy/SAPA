
import { DatePipe } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  MedicalRecordAccessRequest,
  MedicalRecordAccessService
} from '../../services/medical-record-access-service';

@Component({
  selector: 'app-medical-record-access',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './medical-record-access.html',
  styleUrl: './medical-record-access.css'
})
export class MedicalRecordAccess implements OnInit {
  @Input({ required: true }) mode!: 'doctor' | 'patient' | 'tutor';
  @Input() patientId: number | null = null;

  private readonly accessService = inject(MedicalRecordAccessService);

  readonly requests = signal<MedicalRecordAccessRequest[]>([]);
  readonly approvedRequests = signal<MedicalRecordAccessRequest[]>([]);

  readonly loading = signal(false);
  readonly sending = signal(false);
  readonly processingId = signal<number | null>(null);

  // Confirmación de aceptación
  readonly confirmationRequest =
    signal<MedicalRecordAccessRequest | null>(null);

  // Confirmación de revocación
  readonly revokeConfirmation =
    signal<MedicalRecordAccessRequest | null>(null);

  readonly success = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.error.set(null);

    if (this.mode !== 'doctor') {
      this.accessService.getPendingRequests(
        this.mode === 'tutor' ? this.patientId : null
      ).subscribe({
        next: data => {
          this.requests.set(data);
          this.loadApprovedRequests();
        },
        error: err => this.handleLoadError(err)
      });
      return;
    }

    this.accessService.getSentRequests().subscribe({
      next: data => {
        const filtered = this.patientId === null
          ? data
          : data.filter(item => item.patientId === this.patientId);

        this.requests.set(filtered);
        this.loading.set(false);
      },
      error: err => this.handleLoadError(err)
    });
  }

  private loadApprovedRequests(): void {
    this.accessService.getApprovedRequests(
      this.mode === 'tutor' ? this.patientId : null
    ).subscribe({
      next: data => {
        this.approvedRequests.set(data);
        this.loading.set(false);
      },
      error: err => this.handleLoadError(err)
    });
  }

  private handleLoadError(err: unknown): void {
    const response = err as {
      error?: { message?: string }
    };

    this.error.set(
      response?.error?.message ??
      'No se pudieron cargar las autorizaciones.'
    );

    this.loading.set(false);
  }

  get hasPendingRequest(): boolean {
    return this.requests().some(
      request => request.status === 'PENDING'
    );
  }

  sendRequest(): void {
    if (this.patientId === null || this.sending()) {
      return;
    }

    this.sending.set(true);
    this.error.set(null);
    this.success.set(null);

    this.accessService.requestAccess(this.patientId).subscribe({
      next: request => {
        this.requests.update(current => [request, ...current]);

        this.success.set(
          'Solicitud enviada. El paciente recibirá una notificación.'
        );

        this.sending.set(false);
      },
      error: err => {
        this.error.set(
          err?.error?.message ?? 'No se pudo enviar la solicitud.'
        );

        this.sending.set(false);
      }
    });
  }

  // -------------------------
  // ACEPTAR SOLICITUD
  // -------------------------

  approve(request: MedicalRecordAccessRequest): void {
    this.confirmationRequest.set(request);
    this.error.set(null);
    this.success.set(null);
  }

  cancelApproval(): void {
    this.confirmationRequest.set(null);
  }

  confirmApproval(): void {
    const request = this.confirmationRequest();

    if (!request) {
      return;
    }

    this.confirmationRequest.set(null);
    this.processRequest(request.id, 'approve');
  }

  // -------------------------
  // RECHAZAR SOLICITUD
  // -------------------------

  reject(request: MedicalRecordAccessRequest): void {
    this.processRequest(request.id, 'reject');
  }

  // -------------------------
  // REVOCAR AUTORIZACIÓN
  // -------------------------

  openRevokeConfirmation(
    request: MedicalRecordAccessRequest
  ): void {
    this.revokeConfirmation.set(request);
    this.error.set(null);
    this.success.set(null);
  }

  cancelRevoke(): void {
    this.revokeConfirmation.set(null);
  }

  confirmRevoke(): void {
    const request = this.revokeConfirmation();

    if (!request || this.processingId() !== null) {
      return;
    }

    this.revokeConfirmation.set(null);
    this.processingId.set(request.id);
    this.error.set(null);
    this.success.set(null);

    this.accessService.revoke(request.id).subscribe({
      next: () => {
        this.approvedRequests.update(current =>
          current.filter(item => item.id !== request.id)
        );

        this.success.set(
          `Revocaste el acceso de ${request.doctorName} a tu ficha médica.`
        );

        this.processingId.set(null);

        // Actualiza las solicitudes para mantener sincronizada la interfaz.
        this.loadRequests();
      },
      error: err => {
        this.error.set(
          err?.error?.message ?? 'No se pudo revocar el acceso.'
        );

        this.processingId.set(null);
      }
    });
  }

  // -------------------------
  // PROCESAR ACEPTACIÓN / RECHAZO
  // -------------------------

  private processRequest(
    requestId: number,
    action: 'approve' | 'reject'
  ): void {
    if (this.processingId() !== null) {
      return;
    }

    this.processingId.set(requestId);
    this.error.set(null);
    this.success.set(null);

    const operation = action === 'approve'
      ? this.accessService.approve(requestId)
      : this.accessService.reject(requestId);

    operation.subscribe({
      next: updated => {
        this.requests.update(current =>
          current.filter(item => item.id !== requestId)
        );

        if (action === 'approve') {
          this.approvedRequests.update(current => [
            updated,
            ...current.filter(item => item.id !== updated.id)
          ]);
        }

        this.success.set(
          action === 'approve'
            ? `Autorizaste a ${updated.doctorName} para consultar y modificar tu ficha médica.`
            : `Rechazaste la solicitud de ${updated.doctorName}.`
        );

        this.processingId.set(null);
      },
      error: err => {
        this.error.set(
          err?.error?.message ?? 'No se pudo procesar la solicitud.'
        );

        this.processingId.set(null);
      }
    });
  }
}
