
import { TreatmentDuration } from './treatment-duration';
import { TreatmentFrequency } from './treatment-frequency';

export type TreatmentStatus = 'ACTIVE' | 'SUSPENDED' | 'FINISHED';

export interface Treatment {
  treatmentId: number;
  name: string;
  description: string;
  duration: TreatmentDuration;
  frequency: TreatmentFrequency;
  status: TreatmentStatus;
}
