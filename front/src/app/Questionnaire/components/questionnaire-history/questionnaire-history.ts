
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { QuestionnaireService } from '../../services/questionnaire.service';

import {
  AnswerResponse,
  PatientQuestionnaire,
  QuestionnaireResponseDTO
} from '../../models/questionnaire.model';
import { Auth } from '../../../Usuario/services/Auth/auth';
import { TutorPatientSelector } from '../../../Tutor/components/tutor-patient-selector/tutor-patient-selector';

interface ScalePoint {
  responseId: number;
  answeredAt: string;
  value: number;
  min: number;
  max: number;
  percentage: number;
}

interface ScaleGroup {
  questionId: number;
  questionText: string;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  points: ScalePoint[];
}

@Component({
  selector: 'app-questionnaire-history',
  standalone: true,
  imports: [CommonModule, TutorPatientSelector],
  templateUrl: './questionnaire-history.html',
  styleUrl: './questionnaire-history.css'
})
export class QuestionnaireHistory implements OnInit {

  private readonly questionnaireService = inject(QuestionnaireService);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(Auth);

  mode = signal<'patient' | 'doctor'>('patient');

  patients = signal<PatientQuestionnaire[]>([]);
  responses = signal<QuestionnaireResponseDTO[]>([]);

  selectedPatientId = signal<number | null>(null);

  loading = signal(true);
  error = signal('');

  scaleGroups = computed<ScaleGroup[]>(() => {
    const groups = new Map<number, ScaleGroup>();

    for (const response of this.responses()) {
      for (const answer of response.answers ?? []) {

        if (answer.type !== 'SCALE') {
          continue;
        }

        const value = Number(answer.value);
        const min = answer.scaleMin;
        const max = answer.scaleMax;

        if (
          !Number.isFinite(value) ||
          min === null ||
          max === null ||
          min === undefined ||
          max === undefined ||
          max <= min
        ) {
          continue;
        }

        if (!groups.has(answer.questionId)) {
          groups.set(answer.questionId, {
            questionId: answer.questionId,
            questionText: answer.questionText,
            min,
            max,
            minLabel: answer.scaleMinLabel ?? 'Mínimo',
            maxLabel: answer.scaleMaxLabel ?? 'Máximo',
            points: []
          });
        }

        const percentage = ((value - min) / (max - min)) * 100;

        groups.get(answer.questionId)?.points.push({
          responseId: response.responseId,
          answeredAt: response.answeredAt,
          value,
          min,
          max,
          percentage: Math.max(0, Math.min(100, percentage))
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
    } else if (this.auth.isTutor()) {
      const patientId = Number(
        this.route.snapshot.queryParamMap.get('patientId')
      );

      if (Number.isInteger(patientId) && patientId > 0) {
        this.selectedPatientId.set(patientId);
        this.loadMyHistory(patientId);
      } else {
        this.loading.set(false);
      }
    } else {
      this.loadMyHistory();
    }
  }

  loadMyHistory(patientId?: number): void {
    const targetPatientId = this.auth.isTutor()
      ? patientId ?? this.selectedPatientId()
      : null;

    if (this.auth.isTutor() && targetPatientId === null) {
      this.responses.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.questionnaireService.getMyResponses(targetPatientId).subscribe({
      next: (responses: QuestionnaireResponseDTO[]) => {
        this.responses.set(responses ?? []);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error al cargar el historial:', err);
        this.error.set('No se pudo cargar tu historial de cuestionarios.');
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

    if (this.auth.isTutor()) {
      this.loadMyHistory(patientId);
      return;
    }

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
        console.error('Error al cargar respuestas del paciente:', err);
        this.error.set('No se pudo cargar el historial de este paciente.');
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

  getScaleLabel(value: number, min: number, max: number): string {
    const percentage = ((value - min) / (max - min)) * 100;

    if (percentage <= 33) {
      return 'Bajo';
    }

    if (percentage <= 66) {
      return 'Moderado';
    }

    return 'Alto';
  }

  getScaleColor(value: number, min: number, max: number): string {
    const percentage = ((value - min) / (max - min)) * 100;

    if (percentage <= 33) {
      return 'scale-low';
    }

    if (percentage <= 66) {
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
