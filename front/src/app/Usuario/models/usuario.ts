export interface Usuario {
    readonly id:number,
    username?:string,
    firstName?:string,
    lastName?:string,
    role:string,
    email:string,
    birthDate?: string | null,
    requiresTutor?: boolean,
    hasActiveTutor?: boolean
}
