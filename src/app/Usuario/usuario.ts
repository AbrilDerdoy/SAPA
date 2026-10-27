export interface Usuario {
    tipoUsuario:'PACIENTE' | 'MEDICO' | null,
    email:string,
    password:string,
    firstName:string,
    lastName:string,
    birthDate:string,
    phoneNumber:string,
    licenseNumber?:number,
    specialities?:string[]
}
