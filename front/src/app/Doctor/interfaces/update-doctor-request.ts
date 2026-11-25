export interface UpdateDoctorRequest {
    firstName: string;
    lastName: string;
    bio: string | null;
    hospitalUrl: string | null;
    hospitalAddress: string | null;
    hospitalLatitude: number | null;
    hospitalLongitude: number | null;
    phoneNumber: string | null;
    licenseNumber: string;
    speciality: number;
}
