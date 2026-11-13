export interface DoctorProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  bio: string | null;
  hospitalUrl: string | null;
  speciality: number | null;
}
