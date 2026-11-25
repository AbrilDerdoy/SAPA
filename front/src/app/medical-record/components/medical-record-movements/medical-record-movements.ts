
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal
} from '@angular/core';

import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { MedicalRecordService } from '../../services/medical-record-service';
import { MedicalRecordMovement } from '../../interfaces/medical-record-movement';
import { Auth } from '../../../Usuario/services/Auth/auth';

@Component({
  selector: 'app-medical-record-movements',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './medical-record-movements.html',
  styleUrl: './medical-record-movements.css',
})
export class MedicalRecordMovements implements OnChanges {

  @Input({ required: true }) patientId = 0;
  @Input() readonly = true;

  private readonly medicalRecordService = inject(MedicalRecordService);
  private readonly router = inject(Router);

  readonly auth = inject(Auth);

  readonly movimientos = signal<MedicalRecordMovement[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['patientId'] && this.patientId > 0) {
      this.cargarMovimientos();
    }
  }

  cargarMovimientos(): void {

    if (!this.patientId || this.cargando()) {
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.medicalRecordService
      .getRecentMovements(this.patientId)
      .subscribe({

        next: datos => {
          this.movimientos.set(datos ?? []);
          this.cargando.set(false);
        },

        error: err => {

          console.error(
            'Error al cargar movimientos médicos:',
            err
          );

          this.error.set(
            'No se pudieron cargar los movimientos médicos. Verificá que tengas autorización para consultar esta ficha.'
          );

          this.cargando.set(false);
        }
      });
  }

  irAlChat(movimiento: MedicalRecordMovement): void {

    // MÉDICO:
    // Envía el ID del médico autor para que ChatLayout
    // compruebe el seguimiento antes de permitir entrar.

    if (this.auth.isDoctor()) {

      if (!movimiento.doctorId) {

        this.error.set(
          'No se pudo identificar al médico que registró este movimiento.'
        );

        return;
      }

      void this.router.navigate(['/chat'], {

        queryParams: {
          doctorId: movimiento.doctorId,
          movementId: movimiento.id
        },

        state: {
          movementTitle: movimiento.title,
          movementComment: movimiento.comment,
          movementDoctorName: movimiento.doctorName
        }

      });

      return;
    }

    // PACIENTE:
    // Conserva el acceso a la conversación existente.

    if (!movimiento.conversationId) {

      this.error.set(
        'No se encontró una conversación asociada a este movimiento.'
      );

      return;
    }

    void this.router.navigate(['/chat'], {

      queryParams: {
        conversationId: movimiento.conversationId,
        movementId: movimiento.id
      },

      state: {
        movementTitle: movimiento.title,
        movementComment: movimiento.comment,
        movementDoctorName: movimiento.doctorName
      }

    });
  }
}
