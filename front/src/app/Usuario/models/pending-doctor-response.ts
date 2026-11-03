export interface PendingDoctorResponse {
    userId: number,
    doctorId: number,
    firstName: string,
    lastName: string,
    email: string,
    role: string,
    birthDate: Date,
    phoneNumber: number,
    licenseNumber: number,
    specialty: string,
    status: string
}
