export interface PendingDoctorResponse {
    userId: number,
    doctorId: number,
    firstName: string,
    lastName: string,
    email: string,
    role: string,
    birthDate: Date,
    phoneNumber: string | null,
    licenseNumber: number,
    speciality: string,
    status: string
}
