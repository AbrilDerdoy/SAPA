import { TreatmentDuration } from "./treatment-duration";
import { TreatmentFrequency } from "./treatment-frequency";

export interface Treatment {
  treatmentId: number;
  name: string;
  description: string;
  duration: TreatmentDuration;
  frequency: TreatmentFrequency;
}