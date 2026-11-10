export interface registerRequest {
    role:'ROLE_PATIENT' | 'ROLE_TUTOR' | 'ROLE_DOCTOR',
    email:string,
    password:string,
    firstName:string,
    lastName:string,
    birthDate:string,
    phoneNumber:string,
    licenseNumber:string|null,
    specialities:number[]|null,
    relationship?: string | null
}
