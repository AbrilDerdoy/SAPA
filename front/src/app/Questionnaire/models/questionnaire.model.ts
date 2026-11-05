
export type QuestionType = 'TEXT' | 'MULTIPLE_CHOICE' | 'SCALE';

export type SendFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface CreateQuestionRequest {
  text: string;
  type: QuestionType;
  orderIndex: number;
}

export interface CreateQuestionnaireRequest {
  title: string;
  description: string;
  frequency: SendFrequency;
  questions: CreateQuestionRequest[];
}

export interface UpdateQuestionnaireRequest {
  title?: string;
  description?: string;
  frequency?: SendFrequency;
}

export interface AssignQuestionnaireRequest {
  patientId: number;
}

export interface SubmitAnswerRequest {
  questionId: number;
  value: string;
}

export interface SubmitResponseRequest {
  answers: SubmitAnswerRequest[];
}

export interface QuestionResponse {
  questionId: number;
  text: string;
  type: QuestionType;
  orderIndex: number;
}

export interface QuestionnaireResponse {
  questionnaireId: number;
  doctorName: string;
  title: string;
  description: string;
  frequency: SendFrequency;
  questions: QuestionResponse[];
  createdAt: string;
}

export interface AssignmentResponse {
  assignmentId: number;
  questionnaireId: number;
  questionnaireTitle: string;
  patientName: string;
  active: boolean;
  assignedAt: string;
  dueAt: string;
  questions: QuestionResponse[];
}

export interface AnswerResponse {
  answerId: number;
  questionId: number;
  questionText: string;
  type: QuestionType;
  value: string;
}

export interface QuestionnaireResponseDTO {
  responseId: number;
  assignmentId: number;
  questionnaireTitle: string;
  answers: AnswerResponse[];
  answeredAt: string;
}

export interface PatientQuestionnaire {
  patientId: number;
  userId: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  phoneNumber: string;
  medicalRecordId: number;
}
