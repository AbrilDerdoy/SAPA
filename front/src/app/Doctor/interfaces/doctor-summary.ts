export interface DoctorSummary {
    id: number;
    firstName: string;
    lastName: string;
    licenseNumber: string;
    hospitalUrl?: string | null;
}