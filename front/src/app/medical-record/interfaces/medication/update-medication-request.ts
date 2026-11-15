import { MedicationStatus } from "./medication";

export interface UpdateMedicationRequest {
    notes?: string;
    startDate?: string;
    endDate?: string;
    status?: MedicationStatus
}
