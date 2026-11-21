import { DurationUnit, FrequencyUnit } from "./type";

export interface TreatmentFormModel {
  name: string;
  description: string;
  durationLength: number;
  durationUnit: DurationUnit;
  frequencyLength: number;
  frequencyUnit: FrequencyUnit;
}