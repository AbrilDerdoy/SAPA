
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { QuestionnaireService } from '../../services/questionnaire.service';

import {
  AnswerResponse,
  PatientQuestionnaire,
  QuestionnaireResponseDTO
} from '../../models/questionnaire.model';

interface ScalePoint {
  responseId: number;
  answeredAt: string;
  value: number;
}

interface ScaleGroup {
  questionId: number;
  questionText: string;
  points: ScalePoint[];
}

@Component({
  selector: 'app-questionnaire-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './questionnaire-history.html',
  styleUrl: './questionnaire-history.css'
})
export class QuestionnaireHistory implements OnInit {

  private readonly questionnaireService = inject(QuestionnaireService);
  private readonly route = inject(ActivatedRoute);

  mode = signal<'patient' | 'doctor'>('patient');

  patients = signal<PatientQuestionnaire[]>([]);
  responses = signal<QuestionnaireResponseDTO[]>([]);

  selectedPatientId = signal<number | null>(null);

  loading = signal(false);
  error = signal('');

  scaleGroups = computed<ScaleGroup[]>(() => {
    const groups = new Map<number, ScaleGroup>();

    for (const response of this.responses()) {
      for (const answer of response.answers ?? []) {

        if (answer.type !== 'SCALE') {
          continue;
        }

        const value = Number(answer.value);

        if (!Number.isFinite(value)) {
          continue;
        }

        if (!groups.has(answer.questionId)) {
          groups.set(answer.questionId, {
            questionId: answer.questionId,
            questionText: answer.questionText,
            points: []
          });
        }

        groups.get(answer.questionId)!.points.push({
          responseId: response.responseId,
          answeredAt: response.answeredAt,
          value
        });
      }
    }

    return Array.from(groups.values()).map(group => ({
      ...group,
      points: [...group.points].sort(
        (a, b) =>
          new Date(a.answeredAt).getTime() -
          new Date(b.answeredAt).getTime()
      )
    }));
  });

  ngOnInit(): void {
    const routeMode = this.route.snapshot.data['mode'];

    this.mode.set(routeMode === 'doctor' ? 'doctor' : 'patient');

    if (this.mode() === 'doctor') {
      this.loadPatients();
    } else {
      this.loadMyHistory();
    }
  }

  loadMyHistory(): void {
    this.loading.set(true);
    this.error.set('');

    this.questionnaireService.getMyResponses().subscribe({
      next: (responses: QuestionnaireResponseDTO[]) => {
        this.responses.set(responses ?? []);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error al cargar el historial:', err);
        this.error.set(
          'No se pudo cargar tu historial de cuestionarios.'
        );
        this.loading.set(false);
      }
    });
  }

  loadPatients(): void {
    this.loading.set(true);
    this.error.set('');

    this.questionnaireService.getMyPatients().subscribe({
      next: (patients: PatientQuestionnaire[]) => {
        this.patients.set(patients ?? []);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error al cargar pacientes:', err);
        this.error.set('No se pudieron cargar tus pacientes.');
        this.loading.set(false);
      }
    });
  }

  selectPatient(patientId: number): void {
    this.selectedPatientId.set(patientId);

    if (!patientId) {
      this.responses.set([]);
      this.error.set('');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.questionnaireService.getPatientResponses(patientId).subscribe({
      next: (responses: QuestionnaireResponseDTO[]) => {
        this.responses.set(responses ?? []);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error(
          'Error al cargar respuestas del paciente:',
          err
        );
        this.error.set(
          'No se pudo cargar el historial de este paciente.'
        );
        this.loading.set(false);
      }
    });
  }

  getPatientName(patient: PatientQuestionnaire): string {
    return `${patient.firstName} ${patient.lastName}`;
  }

  getAnswers(response: QuestionnaireResponseDTO): AnswerResponse[] {
    return response.answers ?? [];
  }

  getScaleLabel(value: number): string {
    if (value <= 3) {
      return 'Bajo';
    }

    if (value <= 6) {
      return 'Moderado';
    }

    return 'Alto';
  }

  getScaleColor(value: number): string {
    if (value <= 3) {
      return 'scale-low';
    }

    if (value <= 6) {
      return 'scale-medium';
    }

    return 'scale-high';
  }

  trackByResponse(
    index: number,
    response: QuestionnaireResponseDTO
  ): number {
    return response.responseId;
  }
}
