import { TreatmentDuration } from "./treatment-duration";
import { TreatmentFrequency } from "./treatment-frequency";

export interface TreatmentRequest {
  name: string;
  description: string;
  duration: TreatmentDuration;
  frequency: TreatmentFrequency;
}