export interface PublicDoctorProfile {
  id: number;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  bio: string | null;
  hospitalUrl: string | null;
  specialityId: number | null;
  specialityName: string | null;
}
