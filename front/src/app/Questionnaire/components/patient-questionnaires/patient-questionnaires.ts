
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QuestionnaireService } from '../../services/questionnaire.service';
import {
  AssignmentResponse,
  SubmitAnswerRequest
} from '../../models/questionnaire.model';

@Component({
  selector: 'app-patient-questionnaires',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-questionnaires.html',
  styleUrl: './patient-questionnaires.css'
})
export class PatientQuestionnaires implements OnInit {

  private readonly questionnaireService = inject(QuestionnaireService);

  assignments = signal<AssignmentResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  submittingIds = signal<number[]>([]);

  answers: Record<number, string> = {};

  ngOnInit(): void {
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.questionnaireService.getMyAssignments().subscribe({
      next: (assignments) => {
        this.assignments.set(assignments ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar cuestionarios:', err);
        this.error.set('No se pudieron cargar los cuestionarios pendientes.');
        this.loading.set(false);
      }
    });
  }

  updateAnswer(questionId: number, value: string): void {
    this.answers[questionId] = value;
  }

  isSubmitting(assignmentId: number): boolean {
    return this.submittingIds().includes(assignmentId);
  }

  submit(assignment: AssignmentResponse): void {
    this.error.set(null);
    this.success.set(null);

    if (this.isSubmitting(assignment.assignmentId)) {
      return;
    }

    const missingAnswer = assignment.questions.some(
      question => !this.answers[question.questionId]?.trim()
    );

    if (missingAnswer) {
      this.error.set('Completá todas las preguntas antes de enviar.');
      return;
    }

    const invalidScale = assignment.questions.some(question => {
      if (question.type !== 'SCALE') {
        return false;
      }

      const value = Number(this.answers[question.questionId]);

      return !Number.isInteger(value) || value < 1 || value > 10;
    });

    if (invalidScale) {
      this.error.set('Las respuestas de escala deben ser números enteros del 1 al 10.');
      return;
    }

    const response: SubmitAnswerRequest[] = assignment.questions.map(question => ({
      questionId: question.questionId,
      value: this.answers[question.questionId].trim()
    }));

    this.submittingIds.update(ids => [...ids, assignment.assignmentId]);

    this.questionnaireService.submitResponse(assignment.assignmentId, {
      answers: response
    }).subscribe({
      next: () => {
        this.success.set('¡Tus respuestas se enviaron correctamente!');

        this.answers = {};

        this.submittingIds.update(ids =>
          ids.filter(id => id !== assignment.assignmentId)
        );

        this.loadAssignments();
      },
      error: (err) => {
        console.error('Error al enviar respuestas:', err);

        this.error.set(
          err.status === 409
            ? 'Este cuestionario ya fue respondido.'
            : 'No se pudieron enviar las respuestas. Intentá nuevamente.'
        );

        this.submittingIds.update(ids =>
          ids.filter(id => id !== assignment.assignmentId)
        );
      }
    });
  }
}
