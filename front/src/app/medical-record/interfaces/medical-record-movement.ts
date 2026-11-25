export interface MedicalRecordMovement {
  id: number;
  patientId: number;
  doctorId: number;
  doctorName: string;
  type: string;
  title: string;
  comment: string;
  attachments: MedicalRecordMovementAttachment[];
  previousVersionId: number | null;
  supersededById: number | null;
  createdAt: string;
  updatedAt: string | null;
  deleted: boolean;
  deletedAt: string | null;
  conversationId: number | null;
}

export interface MedicalRecordMovementAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  type: string;
  uploadedAt: string;
}

export interface MedicalRecordMovementRequest {
  type: string;
  title: string;
  comment: string;
}

export interface MedicalRecordMovementFilters {
  doctorId?: number | null;
  type?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}
