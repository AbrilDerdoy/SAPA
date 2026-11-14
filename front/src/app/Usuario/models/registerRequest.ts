export interface registerRequest {
    role:'ROLE_PATIENT' | 'ROLE_DOCTOR',
    email:string,
    password:string,
    firstName:string,
    lastName:string,
    birthDate:string,
    phoneNumber:string,
    licenseNumber:string|null,
    speciality:number|null
}
