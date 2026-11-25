import {
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { TutorPatient } from '../../models/tutor.model';
import { TutorService } from '../../services/tutor.service';

@Component({
  selector: 'app-tutor-patient-selector',
  imports: [],
  templateUrl: './tutor-patient-selector.html',
  styleUrl: './tutor-patient-selector.css',
})
export class TutorPatientSelector implements OnInit {
  private readonly tutorService = inject(TutorService);

  readonly selectedPatientId = input<number | null>(null);
  readonly label = input('Paciente');
  readonly patientSelected = output<number>();

  readonly patients = signal<TutorPatient[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading.set(true);
    this.error.set(null);

    this.tutorService.getMyPatients().subscribe({
      next: (patients) => {
        this.patients.set(patients ?? []);
        this.loading.set(false);

        const currentSelection = this.selectedPatientId();
        const exists = patients.some(
          (patient) => patient.patientId === currentSelection,
        );

        if (!exists && patients.length > 0) {
          this.patientSelected.emit(patients[0].patientId);
        }
      },
      error: () => {
        this.error.set('No se pudieron cargar tus pacientes.');
        this.loading.set(false);
      },
    });
  }

  onSelectionChange(event: Event): void {
    const select = event.target;

    if (!(select instanceof HTMLSelectElement)) {
      return;
    }

    const patientId = Number(select.value);

    if (Number.isFinite(patientId) && patientId > 0) {
      this.patientSelected.emit(patientId);
    }
  }

  getPatientName(patient: TutorPatient): string {
    return `${patient.firstName} ${patient.lastName}`;
  }
}
