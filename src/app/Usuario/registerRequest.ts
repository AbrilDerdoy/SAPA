export interface registerRequest {
    role:'PACIENTE' | 'MEDICO' | null,
    email:string,
    password:string,
    firstName:string,
    lastName:string,
    birthDate:string,
    phoneNumber:string,
    licenseNumber:number|null,
    speciality:number|null
}
