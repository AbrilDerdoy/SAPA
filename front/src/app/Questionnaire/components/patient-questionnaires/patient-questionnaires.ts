
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  NgZone,
  inject,
  signal
} from '@angular/core';
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
  private readonly zone = inject(NgZone);
  private readonly changeDetector = inject(ChangeDetectorRef);

  assignments = signal<AssignmentResponse[]>([]);

  // Comienza cargando para evitar mostrar un estado vacío prematuramente.
  loading = signal(true);

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
    this.changeDetector.markForCheck();

    this.questionnaireService.getMyAssignments().subscribe({
      next: assignments => {
        this.zone.run(() => {
          this.assignments.set(assignments ?? []);
          this.loading.set(false);
          this.changeDetector.markForCheck();
        });
      },
      error: err => {
        console.error('Error al cargar cuestionarios:', err);

        this.zone.run(() => {
          this.error.set(
            'No se pudieron cargar los cuestionarios pendientes.'
          );
          this.loading.set(false);
          this.changeDetector.markForCheck();
        });
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

    const invalidAnswer = assignment.questions.some(question => {
      const value = this.answers[question.questionId].trim();

      if (question.type === 'MULTIPLE_CHOICE') {
        return !question.options?.includes(value);
      }

      if (question.type === 'SCALE') {
        const numericValue = Number(value);

        return (
          !Number.isInteger(numericValue) ||
          question.scaleMin === null ||
          question.scaleMax === null ||
          numericValue < question.scaleMin ||
          numericValue > question.scaleMax
        );
      }

      return false;
    });

    if (invalidAnswer) {
      this.error.set('Revisá las opciones y los valores de las escalas.');
      return;
    }

    const response: SubmitAnswerRequest[] = assignment.questions.map(question => ({
      questionId: question.questionId,
      value: this.answers[question.questionId].trim()
    }));

    this.submittingIds.update(ids => [...ids, assignment.assignmentId]);

    this.questionnaireService.submitResponse(
      assignment.assignmentId,
      { answers: response }
    ).subscribe({
      next: () => {
        this.zone.run(() => {
          this.success.set('¡Tus respuestas se enviaron correctamente!');
          this.answers = {};

          this.submittingIds.update(ids =>
            ids.filter(id => id !== assignment.assignmentId)
          );

          this.changeDetector.markForCheck();

          // Recarga automáticamente los cuestionarios pendientes.
          this.loadAssignments();
        });
      },
      error: err => {
        console.error('Error al enviar respuestas:', err);

        this.zone.run(() => {
          this.error.set(
            err.status === 409
              ? 'Este cuestionario ya fue respondido.'
              : err.error?.message ||
                'No se pudieron enviar las respuestas. Intentá nuevamente.'
          );

          this.submittingIds.update(ids =>
            ids.filter(id => id !== assignment.assignmentId)
          );

          this.changeDetector.markForCheck();
        });
      }
    });
  }
}
