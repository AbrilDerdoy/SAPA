
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QuestionnaireService } from '../../services/questionnaire.service';

import {
  CreateQuestionnaireRequest,
  PatientQuestionnaire,
  QuestionType,
  QuestionnaireResponse,
  SendFrequency
} from '../../models/questionnaire.model';

@Component({
  selector: 'app-doctor-questionnaires',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './doctor-questionnaires.html',
  styleUrl: './doctor-questionnaires.css'
})
export class DoctorQuestionnaires implements OnInit {

  private readonly service = inject(QuestionnaireService);

  questionnaires = signal<QuestionnaireResponse[]>([]);
  patients = signal<PatientQuestionnaire[]>([]);

  loading = signal(false);
  loadingPatients = signal(false);
  saving = signal(false);
  assigning = signal(false);

  message = signal('');
  error = signal('');

  title = '';
  description = '';
  frequency: SendFrequency = 'WEEKLY';

  questions: { text: string; type: QuestionType }[] = [
    { text: '', type: 'TEXT' }
  ];

  selectedQuestionnaireId: number | null = null;
  selectedPatientId: number | null = null;

  ngOnInit(): void {
    this.loadQuestionnaires();
    this.loadPatients();
  }

  loadQuestionnaires(): void {
    this.loading.set(true);

    this.service.getMyQuestionnaires().subscribe({
      next: data => {
        this.questionnaires.set(data ?? []);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar cuestionarios:', err);
        this.error.set('No se pudieron cargar los cuestionarios.');
        this.loading.set(false);
      }
    });
  }

  loadPatients(): void {
    this.loadingPatients.set(true);

    this.service.getMyPatients().subscribe({
      next: data => {
        this.patients.set(data ?? []);
        this.loadingPatients.set(false);
      },
      error: err => {
        console.error('Error al cargar pacientes:', err);
        this.error.set('No se pudieron cargar tus pacientes vinculados.');
        this.loadingPatients.set(false);
      }
    });
  }

  addQuestion(): void {
    this.questions.push({
      text: '',
      type: 'TEXT'
    });
  }

  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.splice(index, 1);
    }
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

    if (this.questions.length === 0) {
      this.error.set('Agregá al menos una pregunta.');
      return;
    }

    if (this.questions.some(question => !question.text.trim())) {
      this.error.set('Completá todas las preguntas antes de guardar.');
      return;
    }

    const data: CreateQuestionnaireRequest = {
      title: cleanTitle,
      description: cleanDescription,
      frequency: this.frequency,
      questions: this.questions.map((question, index) => ({
        text: question.text.trim(),
        type: question.type,
        orderIndex: index
      }))
    };

    this.saving.set(true);

    this.service.createQuestionnaire(data).subscribe({
      next: () => {
        this.message.set('Cuestionario creado correctamente.');
        this.resetForm();
        this.saving.set(false);
        this.loadQuestionnaires();
      },
      error: err => {
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

    const questionnaireExists = this.questionnaires().some(
      questionnaire =>
        questionnaire.questionnaireId === this.selectedQuestionnaireId
    );

    const patientExists = this.patients().some(
      patient => patient.patientId === this.selectedPatientId
    );

    if (!questionnaireExists || !patientExists) {
      this.error.set(
        'La selección realizada no es válida. Volvé a seleccionar.'
      );
      return;
    }

    this.assigning.set(true);

    this.service.assignQuestionnaire(
      this.selectedQuestionnaireId,
      { patientId: this.selectedPatientId }
    ).subscribe({
      next: () => {
        this.message.set('Cuestionario asignado correctamente.');
        this.selectedQuestionnaireId = null;
        this.selectedPatientId = null;
        this.assigning.set(false);
      },
      error: err => {
        console.error('Error al asignar cuestionario:', err);

        this.error.set(
          err.error?.message || 'No se pudo asignar el cuestionario.'
        );

        this.assigning.set(false);
      }
    });
  }

  private resetForm(): void {
    this.title = '';
    this.description = '';
    this.frequency = 'WEEKLY';

    this.questions = [
      { text: '', type: 'TEXT' }
    ];
  }
}
