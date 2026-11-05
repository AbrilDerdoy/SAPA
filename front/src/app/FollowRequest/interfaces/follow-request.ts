import { FollowRequestStatus } from './follow-request-status';
import { PatientSummary } from './patient-summary';

export interface DoctorSummary {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface FollowRequest {
  id: number;

  // Se completa cuando quien solicita es un paciente.
  patient: PatientSummary | null;

  // Se completa cuando quien solicita es un doctor.
  doctorFollower: DoctorSummary | null;

  // Doctor al que se solicita seguir.
  doctor: DoctorSummary;

  status: FollowRequestStatus;
  requestedAt: string;
  respondedAt: string | null;
}