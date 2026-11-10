export type TutorInvitationDirection =
  | 'TUTOR_INVITES_PATIENT'
  | 'PATIENT_INVITES_TUTOR';

export type TutorInvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'REVOKED';

export interface Tutor {
  tutorId: number;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  phoneNumber: string;
  relationship: string;
}

export interface TutorPatient {
  patientId: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  phoneNumber: string;
  medicalRecordId: number | null;
  linkedAt: string;
}

export interface TutorInvitation {
  id: number;
  token: string;
  direction: TutorInvitationDirection;
  invitedEmail: string;
  status: TutorInvitationStatus;
  createdAt: string;
  expiresAt: string;
}
