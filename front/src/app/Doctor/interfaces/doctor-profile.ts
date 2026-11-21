export interface DoctorProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  licenseNumber: string;
  bio: string | null;
  hospitalUrl: string | null;
  hospitalAddress: string | null;
  hospitalLatitude: number | null;
  hospitalLongitude: number | null;
  speciality: number | null;
}
