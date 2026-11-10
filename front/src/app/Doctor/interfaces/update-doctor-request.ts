export interface UpdateDoctorRequest {
    firstName: string;
    lastName: string;
    bio: string | null;
    hospitalUrl: string | null;
    phoneNumber: string;
    licenseNumber: string;
    specialities: number[];
}