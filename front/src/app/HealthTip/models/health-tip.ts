export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  licenseNumber?: string;
}

export interface HealthTip {
  id?: number;
  title: string;
  content: string;
  doctor?: Doctor | null;
  institutional?: boolean;
}

export interface CreateHealthTip {
  title: string;
  content: string;
}