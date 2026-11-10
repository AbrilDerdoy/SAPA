export interface Patient {
  patientId: number;
  userId: number;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  phoneNumber: string | null;
  medicalRecordId: number | null;
}