import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QuestionnaireService } from '../../services/questionnaire.service';

import {
  CreateQuestionnaireRequest,
  CreateQuestionRequest,
  PatientQuestionnaire,
  QuestionType,
  QuestionnaireResponse,
  AssignmentResponse,
  SendFrequency
} from '../../models/questionnaire.model';

interface EditableQuestion {
  text: string;
  type: QuestionType;
  options: string[];
  scaleMin: number;
  scaleMax: number;
  scaleMinLabel: string;
  scaleMaxLabel: string;
}

@Component({
  selector: 'app-doctor-questionnaires',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-questionnaires.html',
  styleUrl: './doctor-questionnaires.css'
})
export class DoctorQuestionnaires implements OnInit {
  private readonly service = inject(QuestionnaireService);

  questionnaires = signal<QuestionnaireResponse[]>([]);
  patients = signal<PatientQuestionnaire[]>([]);
  assignments = signal<AssignmentResponse[]>([]);

  loading = signal(false);
  loadingPatients = signal(false);
  loadingAssignments = signal(false);
  saving = signal(false);
  assigning = signal(false);
  savingNewQuestion = signal(false);

  addingQuestionToId = signal<number | null>(null);
  expandedQuestionnaireIds = signal<number[]>([]);
  unassigningIds = signal<number[]>([]);

  message = signal('');
  error = signal('');

  assignmentToUnassign = signal<AssignmentResponse | null>(null);

  title = '';
  description = '';
  frequency: SendFrequency = 'WEEKLY';

  questions: EditableQuestion[] = [this.createEmptyQuestion()];
  newQuestion: EditableQuestion = this.createEmptyQuestion();

  selectedQuestionnaireId: number | null = null;
  selectedPatientId: number | null = null;

  ngOnInit(): void {
    this.loadQuestionnaires();
    this.loadPatients();
    this.loadAssignments();
  }

  private createEmptyQuestion(): EditableQuestion {
    return {
      text: '',
      type: 'TEXT',
      options: ['', ''],
      scaleMin: 1,
      scaleMax: 10,
      scaleMinLabel: 'Mínimo',
      scaleMaxLabel: 'Máximo'
    };
  }

  loadQuestionnaires(): void {
    this.loading.set(true);

    this.service.getMyQuestionnaires().subscribe({
      next: (data: QuestionnaireResponse[]) => {
        this.questionnaires.set(data ?? []);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error al cargar cuestionarios:', err);
        this.error.set('No se pudieron cargar los cuestionarios.');
        this.loading.set(false);
      }
    });
  }

  loadPatients(): void {
    this.loadingPatients.set(true);

    this.service.getMyPatients().subscribe({
      next: (data: PatientQuestionnaire[]) => {
        this.patients.set(data ?? []);
        this.loadingPatients.set(false);
      },
      error: (err: unknown) => {
        console.error('Error al cargar pacientes:', err);
        this.error.set('No se pudieron cargar tus pacientes vinculados.');
        this.loadingPatients.set(false);
      }
    });
  }

  loadAssignments(): void {
    this.loadingAssignments.set(true);

    this.service.getMyAssignedQuestionnaires().subscribe({
      next: (data: AssignmentResponse[]) => {
        this.assignments.set(data ?? []);
        this.loadingAssignments.set(false);
      },
      error: (err: unknown) => {
        console.error('Error al cargar asignaciones:', err);
        this.error.set('No se pudieron cargar las asignaciones.');
        this.loadingAssignments.set(false);
      }
    });
  }

  addQuestion(): void {
    this.questions.push(this.createEmptyQuestion());
  }

  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.splice(index, 1);
    }
  }

  addOption(question: EditableQuestion): void {
    question.options.push('');
  }

  removeOption(question: EditableQuestion, index: number): void {
    if (question.options.length > 2) {
      question.options.splice(index, 1);
    }
  }

  private validateQuestion(question: EditableQuestion): string | null {
    if (!question.text.trim()) {
      return 'Escribí el texto de la pregunta.';
    }

    if (question.type === 'MULTIPLE_CHOICE') {
      const options = question.options.map(option => option.trim());

      if (options.length < 2 || options.some(option => !option)) {
        return 'La pregunta debe tener al menos dos opciones completas.';
      }

      if (
        new Set(options.map(option => option.toLowerCase())).size !== options.length
      ) {
        return 'No puede haber opciones repetidas.';
      }
    }

    if (question.type === 'SCALE') {
      if (
        !Number.isInteger(question.scaleMin) ||
        !Number.isInteger(question.scaleMax) ||
        question.scaleMin >= question.scaleMax
      ) {
        return 'El mínimo de la escala debe ser menor que el máximo.';
      }

      if (
        !question.scaleMinLabel.trim() ||
        !question.scaleMaxLabel.trim()
      ) {
        return 'Completá las etiquetas de los extremos de la escala.';
      }
    }

    return null;
  }

  private toQuestionRequest(
    question: EditableQuestion,
    orderIndex: number
  ): CreateQuestionRequest {
    return {
      text: question.text.trim(),
      type: question.type,
      orderIndex,
      options: question.type === 'MULTIPLE_CHOICE'
        ? question.options.map(option => option.trim())
        : [],
      scaleMin: question.type === 'SCALE' ? question.scaleMin : null,
      scaleMax: question.type === 'SCALE' ? question.scaleMax : null,
      scaleMinLabel: question.type === 'SCALE'
        ? question.scaleMinLabel.trim()
        : null,
      scaleMaxLabel: question.type === 'SCALE'
        ? question.scaleMaxLabel.trim()
        : null
    };
  }

  createQuestionnaire(): void {
    if (this.saving()) {
      return;
    }

    this.message.set('');
    this.error.set('');

    const cleanTitle = this.title.trim();
    const cleanDescription = this.description.trim();

    if (!cleanTitle) {
      this.error.set('Ingresá un título para el cuestionario.');
      return;
    }

    if (!cleanDescription) {
      this.error.set('Ingresá una descripción para el cuestionario.');
      return;
    }

    for (const question of this.questions) {
      const validationError = this.validateQuestion(question);

      if (validationError) {
        this.error.set(validationError);
        return;
      }
    }

    const data: CreateQuestionnaireRequest = {
      title: cleanTitle,
      description: cleanDescription,
      frequency: this.frequency,
      questions: this.questions.map((question, index) =>
        this.toQuestionRequest(question, index)
      )
    };

    this.saving.set(true);

    this.service.createQuestionnaire(data).subscribe({
      next: () => {
        this.message.set('Cuestionario creado correctamente.');
        this.resetForm();
        this.saving.set(false);
        this.loadQuestionnaires();
      },
      error: (err: any) => {
        console.error('Error al crear cuestionario:', err);
        this.error.set(
          err.error?.message || 'No se pudo crear el cuestionario.'
        );
        this.saving.set(false);
      }
    });
  }

  assignQuestionnaire(): void {
    if (this.assigning()) {
      return;
    }

    this.message.set('');
    this.error.set('');

    if (this.selectedQuestionnaireId === null) {
      this.error.set('Seleccioná un cuestionario.');
      return;
    }

    if (this.selectedPatientId === null) {
      this.error.set('Seleccioná un paciente.');
      return;
    }

    const questionnaireId = this.selectedQuestionnaireId;
    const patientId = this.selectedPatientId;

    const questionnaireExists = this.questionnaires().some(
      questionnaire => questionnaire.questionnaireId === questionnaireId
    );

    const patientExists = this.patients().some(
      patient => patient.patientId === patientId
    );

    if (!questionnaireExists || !patientExists) {
      this.error.set('La selección realizada no es válida. Volvé a seleccionar.');
      return;
    }

    this.assigning.set(true);

    this.service.assignQuestionnaire(
      questionnaireId,
      { patientId }
    ).subscribe({
      next: () => {
        this.message.set('Cuestionario asignado correctamente.');
        this.selectedQuestionnaireId = null;
        this.selectedPatientId = null;
        this.assigning.set(false);
        this.loadAssignments();
      },
      error: (err: any) => {
        console.error('Error al asignar cuestionario:', err);
        this.error.set(
          err.error?.message || 'No se pudo asignar el cuestionario.'
        );
        this.assigning.set(false);
      }
    });
  }

  toggleQuestionnaireQuestions(questionnaireId: number): void {
    this.expandedQuestionnaireIds.update(ids =>
      ids.includes(questionnaireId)
        ? ids.filter(id => id !== questionnaireId)
        : [...ids, questionnaireId]
    );
  }

  openAddQuestion(questionnaireId: number): void {
    this.message.set('');
    this.error.set('');

    if (this.addingQuestionToId() === questionnaireId) {
      this.addingQuestionToId.set(null);
      this.newQuestion = this.createEmptyQuestion();
      return;
    }

    this.newQuestion = this.createEmptyQuestion();
    this.addingQuestionToId.set(questionnaireId);
  }

  saveNewQuestion(questionnaireId: number): void {
    if (this.savingNewQuestion()) {
      return;
    }

    this.message.set('');
    this.error.set('');

    const validationError = this.validateQuestion(this.newQuestion);

    if (validationError) {
      this.error.set(validationError);
      return;
    }

    const questionnaire = this.questionnaires().find(
      item => item.questionnaireId === questionnaireId
    );

    if (!questionnaire) {
      this.error.set('No se encontró el cuestionario seleccionado.');
      return;
    }

    const request = this.toQuestionRequest(
      this.newQuestion,
      questionnaire.questions.length
    );

    this.savingNewQuestion.set(true);

    this.service.addQuestion(questionnaireId, request).subscribe({
      next: (updatedQuestionnaire: QuestionnaireResponse) => {
        this.questionnaires.update(items =>
          items.map(item =>
            item.questionnaireId === questionnaireId
              ? updatedQuestionnaire
              : item
          )
        );

        this.message.set(
          'La nueva pregunta se agregó correctamente. Las preguntas anteriores se conservaron.'
        );

        this.newQuestion = this.createEmptyQuestion();
        this.addingQuestionToId.set(null);
        this.savingNewQuestion.set(false);
      },
      error: (err: any) => {
        console.error('Error al agregar pregunta:', err);
        this.error.set(
          err.error?.message || 'No se pudo agregar la pregunta.'
        );
        this.savingNewQuestion.set(false);
      }
    });
  }

  unassignQuestionnaire(assignment: AssignmentResponse): void {
    if (this.unassigningIds().includes(assignment.assignmentId)) {
      return;
    }

    this.message.set('');
    this.error.set('');
    this.assignmentToUnassign.set(assignment);
  }

  cancelUnassign(): void {
    if (this.unassigningIds().length > 0) {
      return;
    }

    this.assignmentToUnassign.set(null);
  }

  confirmUnassign(): void {
    const assignment = this.assignmentToUnassign();

    if (
      !assignment ||
      this.unassigningIds().includes(assignment.assignmentId)
    ) {
      return;
    }

    this.unassigningIds.update(ids => [
      ...ids,
      assignment.assignmentId
    ]);

    this.service.unassignQuestionnaire(assignment.assignmentId).subscribe({
      next: () => {
        this.assignments.update(items =>
          items.filter(item =>
            item.assignmentId !== assignment.assignmentId
          )
        );

        this.assignmentToUnassign.set(null);
        this.message.set(
          `Se desasignó "${assignment.questionnaireTitle}" de ${assignment.patientName}.`
        );

        this.unassigningIds.update(ids =>
          ids.filter(id => id !== assignment.assignmentId)
        );
      },
      error: (err: any) => {
        console.error('Error al desasignar cuestionario:', err);

        this.assignmentToUnassign.set(null);
        this.error.set(
          err.error?.message || 'No se pudo desasignar el cuestionario.'
        );

        this.unassigningIds.update(ids =>
          ids.filter(id => id !== assignment.assignmentId)
        );
      }
    });
  }

  private resetForm(): void {
    this.title = '';
    this.description = '';
    this.frequency = 'WEEKLY';
    this.questions = [this.createEmptyQuestion()];
  }
}