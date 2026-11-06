export interface Medication {
    medicationId: number;
    fdaDrugName: string;
    notes: string | null;
    startDate: string;
    endDate: string | null;
    addedAt: string;
}
