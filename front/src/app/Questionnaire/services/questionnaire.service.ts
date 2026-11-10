
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  PatientQuestionnaire,
  CreateQuestionnaireRequest,
  CreateQuestionRequest,
  UpdateQuestionnaireRequest,
  AssignQuestionnaireRequest,
  SubmitResponseRequest,
  QuestionnaireResponse,
  AssignmentResponse,
  QuestionnaireResponseDTO
} from '../models/questionnaire.model';

@Injectable({
  providedIn: 'root'
})
export class QuestionnaireService {
  private readonly http = inject(HttpClient);

  private readonly questionnaireUrl = 'http://localhost:8080/questionnaires';
  private readonly assignmentUrl = 'http://localhost:8080/assignments';
  private readonly patientUrl = 'http://localhost:8080/patients';

  createQuestionnaire(data: CreateQuestionnaireRequest): Observable<QuestionnaireResponse> {
    return this.http.post<QuestionnaireResponse>(this.questionnaireUrl, data);
  }

  getMyQuestionnaires(): Observable<QuestionnaireResponse[]> {
    return this.http.get<QuestionnaireResponse[]>(`${this.questionnaireUrl}/my-questionnaires`);
  }

  addQuestion(questionnaireId: number, data: CreateQuestionRequest): Observable<QuestionnaireResponse> {
    return this.http.post<QuestionnaireResponse>(
      `${this.questionnaireUrl}/${questionnaireId}/questions`, data
    );
  }

  updateQuestionnaire(id: number, data: UpdateQuestionnaireRequest): Observable<QuestionnaireResponse> {
    return this.http.put<QuestionnaireResponse>(`${this.questionnaireUrl}/${id}`, data);
  }

  deleteQuestionnaire(id: number): Observable<void> {
    return this.http.delete<void>(`${this.questionnaireUrl}/${id}`);
  }

  assignQuestionnaire(questionnaireId: number, data: AssignQuestionnaireRequest): Observable<AssignmentResponse> {
    return this.http.post<AssignmentResponse>(`${this.assignmentUrl}/${questionnaireId}`, data);
  }

  getMyAssignments(patientId?: number | null): Observable<AssignmentResponse[]> {
    const params = patientId
      ? new HttpParams().set('patientId', patientId)
      : undefined;

    return this.http.get<AssignmentResponse[]>(
      `${this.assignmentUrl}/my-assignments`,
      { params }
    );
  }

  submitResponse(assignmentId: number, data: SubmitResponseRequest): Observable<QuestionnaireResponseDTO> {
    return this.http.post<QuestionnaireResponseDTO>(
      `${this.assignmentUrl}/${assignmentId}/submit`, data
    );
  }

  getMyResponses(patientId?: number | null): Observable<QuestionnaireResponseDTO[]> {
    const params = patientId
      ? new HttpParams().set('patientId', patientId)
      : undefined;

    return this.http.get<QuestionnaireResponseDTO[]>(
      `${this.assignmentUrl}/my-responses`,
      { params }
    );
  }

  getQuestionnaireResponses(questionnaireId: number): Observable<QuestionnaireResponseDTO[]> {
    return this.http.get<QuestionnaireResponseDTO[]>(
      `${this.assignmentUrl}/${questionnaireId}/responses`
    );
  }

  getPatientResponses(patientId: number): Observable<QuestionnaireResponseDTO[]> {
    return this.http.get<QuestionnaireResponseDTO[]>(
      `${this.assignmentUrl}/patient/${patientId}/responses`
    );
  }

  getMyPatients(): Observable<PatientQuestionnaire[]> {
    return this.http.get<PatientQuestionnaire[]>(`${this.patientUrl}/my-patients`);
  }
}
