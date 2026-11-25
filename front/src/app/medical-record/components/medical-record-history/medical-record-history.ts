
import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { DatePipe, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MedicalRecordService } from '../../services/medical-record-service';
import { MedicalRecordMovement } from '../../interfaces/medical-record-movement';

import { Auth } from '../../../Usuario/services/Auth/auth';
import { DoctorService } from '../../../Doctor/service/doctor.service';
import { ChatService } from '../../../Chat/services/chat.service';

interface DoctorOption {
  id: number;
  name: string;
}

interface FollowPrompt {
  movementId: number;
  doctorId: number;
  doctorName: string;
  status: 'NONE' | 'PENDING' | 'REJECTED' | 'DISOLVED';
}

@Component({
  selector: 'app-medical-record-history',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './medical-record-history.html',
  styleUrl: './medical-record-history.css',
})
export class MedicalRecordHistory implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(MedicalRecordService);
  private readonly location = inject(Location);

  private readonly auth = inject(Auth);
  private readonly doctorService = inject(DoctorService);
  private readonly chatService = inject(ChatService);

  patientId = 0;

  readonly movements = signal<MedicalRecordMovement[]>([]);
  readonly allMovements = signal<MedicalRecordMovement[]>([]);
  readonly doctors = signal<DoctorOption[]>([]);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly doctorId = signal('');
  readonly type = signal('');
  readonly fromDate = signal('');
  readonly toDate = signal('');

  readonly followPrompt = signal<FollowPrompt | null>(null);
  readonly followActionLoading = signal(false);
  readonly followActionMessage = signal('');
  readonly followActionError = signal(false);

  readonly isDoctor = computed(() => this.auth.isDoctor());

  readonly showingFilters = computed(() =>
    !!(
      this.doctorId() ||
      this.type() ||
      this.fromDate() ||
      this.toDate()
    )
  );

  ngOnInit(): void {

    this.patientId = Number(
      this.route.snapshot.paramMap.get('patientId')
    );

    if (!Number.isInteger(this.patientId) || this.patientId <= 0) {
      this.error.set(
        'El identificador del paciente no es válido.'
      );
      return;
    }

    this.loadDoctorOptions();
    this.search();
  }

  private loadDoctorOptions(): void {

    this.service.getAllMovements(this.patientId).subscribe({

      next: data => {

        this.allMovements.set(data ?? []);

        const doctorsMap = new Map<number, string>();

        for (const movement of data ?? []) {

          if (movement.doctorId && movement.doctorName) {
            doctorsMap.set(
              movement.doctorId,
              movement.doctorName
            );
          }
        }

        this.doctors.set(
          Array.from(doctorsMap.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) =>
              a.name.localeCompare(b.name, 'es')
            )
        );
      },

      error: err => {
        console.error(
          'No se pudieron cargar los médicos del historial:',
          err
        );
      }
    });
  }

  search(): void {

    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const from = this.fromDate()
      ? `${this.fromDate()}T00:00:00`
      : undefined;

    const to = this.toDate()
      ? `${this.toDate()}T23:59:59`
      : undefined;

    const doctor = this.doctorId()
      ? Number(this.doctorId())
      : undefined;

    if (
      this.fromDate() &&
      this.toDate() &&
      this.fromDate() > this.toDate()
    ) {
      this.error.set(
        'La fecha inicial no puede ser posterior a la fecha final.'
      );

      this.loading.set(false);
      return;
    }

    this.service.filterMovements(this.patientId, {
      doctorId: doctor,
      type: this.type().trim() || undefined,
      fromDate: from,
      toDate: to,
    }).subscribe({

      next: data => {
        this.movements.set(data ?? []);
        this.loading.set(false);
      },

      error: err => {

        console.error(
          'Error al consultar el historial médico:',
          err
        );

        this.error.set(
          'No se pudo cargar el historial. Comprobá que tengas permiso para consultar esta ficha.'
        );

        this.loading.set(false);
      }
    });
  }

  irAlChat(movement: MedicalRecordMovement): void {

    this.followPrompt.set(null);
    this.followActionMessage.set('');
    this.followActionError.set(false);

    // PACIENTE: abre el chat privado con el médico autor.

    if (!this.auth.isDoctor()) {

      if (!movement.conversationId) {
        this.error.set(
          'No se encontró una conversación asociada a este movimiento.'
        );
        return;
      }

      void this.router.navigate(['/chat'], {
        queryParams: {
          conversationId: movement.conversationId,
          movementId: movement.id,
          movementTitle: movement.title,
          movementComment: movement.comment
        }
      });

      return;
    }

    // MÉDICO: primero comprueba el seguimiento.

    if (!movement.doctorId) {
      this.error.set(
        'No se pudo identificar al médico que registró el movimiento.'
      );
      return;
    }

    this.doctorService.getSentFollowRequests().subscribe({

      next: requests => {

        const doctorRequests = requests
          .filter(request =>
            request.doctor?.id === movement.doctorId
          )
          .sort((a, b) =>
            new Date(b.requestedAt).getTime() -
            new Date(a.requestedAt).getTime()
          );

        const latestRequest = doctorRequests[0];

        if (latestRequest?.status !== 'APPROVED') {

          const status: FollowPrompt['status'] =
            latestRequest?.status === 'PENDING'
              ? 'PENDING'
              : latestRequest?.status === 'REJECTED'
                ? 'REJECTED'
                : latestRequest?.status === 'DISOLVED'
                  ? 'DISOLVED'
                  : 'NONE';

          this.followPrompt.set({
            movementId: movement.id,
            doctorId: movement.doctorId,
            doctorName: movement.doctorName,
            status
          });

          return;
        }

        // Solo si el seguimiento está aprobado busca el chat.

        this.openApprovedDoctorConversation(movement);
      },

      error: err => {

        console.error(
          'No se pudo verificar el seguimiento:',
          err
        );

        this.error.set(
          'No se pudo comprobar el seguimiento con este médico. Intentá nuevamente.'
        );
      }
    });
  }

  private openApprovedDoctorConversation(
    movement: MedicalRecordMovement
  ): void {

    this.chatService.getConversations().subscribe({

      next: conversations => {

        const normalize = (name: string): string =>
          name
            .toLocaleLowerCase('es')
            .replace(/^dr\.?\s*/, '')
            .replace(/\s+/g, ' ')
            .trim();

        const targetName = normalize(movement.doctorName);

        const conversation = conversations.find(
          item =>
            normalize(item.otherParticipantName) === targetName
        );

        if (!conversation) {

          this.error.set(
            `El seguimiento con ${movement.doctorName} está aprobado, pero no se encontró su conversación. Volvé a ingresar al chat desde el menú de mensajería.`
          );

          return;
        }

        void this.router.navigate(['/chat'], {
          queryParams: {
            conversationId: conversation.conversationId,
            movementId: movement.id,
            movementTitle: movement.title,
            movementComment: movement.comment
          }
        });
      },

      error: err => {

        console.error(
          'No se pudieron consultar las conversaciones:',
          err
        );

        this.error.set(
          'No se pudo abrir la conversación con el profesional.'
        );
      }
    });
  }

  requestFollowForMovement(): void {

    const prompt = this.followPrompt();

    if (!prompt || this.followActionLoading()) {
      return;
    }

    if (prompt.status === 'PENDING') {
      this.followActionMessage.set(
        'Ya enviaste una solicitud. Esperá a que el médico la apruebe.'
      );
      return;
    }

    this.followActionLoading.set(true);
    this.followActionMessage.set('');
    this.followActionError.set(false);

    this.doctorService.sendFollowRequest(
      prompt.doctorId
    ).subscribe({

      next: () => {

        this.followPrompt.update(current =>
          current
            ? { ...current, status: 'PENDING' }
            : null
        );

        this.followActionMessage.set(
          `Solicitud enviada a ${prompt.doctorName}. Cuando la apruebe, vas a poder comunicarte por el chat.`
        );

        this.followActionLoading.set(false);
      },

      error: err => {

        console.error(
          'Error al enviar la solicitud:',
          err
        );

        this.followActionMessage.set(
          err.error?.message ??
          'No se pudo enviar la solicitud. Puede que ya exista una solicitud pendiente.'
        );

        this.followActionError.set(true);
        this.followActionLoading.set(false);
      }
    });
  }

  closeFollowPrompt(): void {
    this.followPrompt.set(null);
    this.followActionMessage.set('');
    this.followActionError.set(false);
  }

  volver(): void {
    this.location.back();
  }

  clearFilters(): void {

    this.doctorId.set('');
    this.type.set('');
    this.fromDate.set('');
    this.toDate.set('');

    this.search();
  }
}
