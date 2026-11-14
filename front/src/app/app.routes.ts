
import { Routes } from '@angular/router';

import { roleGuard } from './FollowRequest/guards/role-guard';
import { adminGuard } from './Usuario/guards/admin-guard';
import { doctorGuard, patientGuard } from './Doctor/guards/role-doctor-guard';

import { Home } from './home/home';
import { Forum } from './forum/forum-component/forum/forum';
import { Registro } from './Usuario/components/registro/registro';
import { Login } from './Usuario/components/login/login';
import { ForgotPassword } from './Usuario/components/forgot-password/forgot-password';
import { ResetPassword } from './Usuario/components/reset-password/reset-password';
import { Post } from './post/post-component/post/post';
import { UpdateForum } from './forum/forum-component/update-forum/update-forum';
import { CreateForum } from './forum/forum-component/create-forum/create-forum';
import { Profile } from './Usuario/components/profile/profile';
import { SavedPost } from './saved-post/saved-post-component/saved-post/saved-post';
import { PanelAdmin } from './Usuario/components/panel-admin/panel-admin';

import { DoctorQuestionnaires } from './Questionnaire/components/doctor-questionnaires/doctor-questionnaires';
import { PatientQuestionnaires } from './Questionnaire/components/patient-questionnaires/patient-questionnaires';
import { QuestionnaireHistory } from './Questionnaire/components/questionnaire-history/questionnaire-history';
import { MyMedicalRecord } from './medical-record/components/my-medical-record/my-medical-record';
import { PatientMedicalRecord } from './medical-record/components/patient-medical-record/patient-medical-record';

export const routes: Routes = [

  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Autenticación
  { path: 'register', component: Registro },
  { path: 'login', component: Login },

  // Inicio
  { path: 'home', component: Home },

  // Foros
  { path: 'forums', component: Forum },
  { path: 'forums/create', component: CreateForum },
  { path: 'forums/update/:titleForum', component: UpdateForum },
  { path: 'forums/:titleForum', component: Post },

  // Publicaciones guardadas
  { path: 'saved', component: SavedPost },

  // Recuperación de contraseña
  { path: 'forgotPassword', component: ForgotPassword },
  { path: 'resetPassword', component: ResetPassword },

  // Perfil
  { path: 'profile', component: Profile },

  // Chat
  {
    path: 'chat',
    loadChildren: () =>
      import('./Chat/chat.routes').then(m => m.chatRoutes)
  },

  // Solicitudes de seguimiento
  {
    path: 'solicitudes',
    canActivate: [roleGuard(['DOCTOR'])],
    data: { mode: 'doctor' },
    loadComponent: () =>
      import('./FollowRequest/components/follow-requests/follow-requests')
        .then(m => m.FollowRequests)
  },
  {
    path: 'mis-solicitudes',
    canActivate: [roleGuard(['PATIENT'])],
    data: { mode: 'patient' },
    loadComponent: () =>
      import('./FollowRequest/components/follow-requests/follow-requests')
        .then(m => m.FollowRequests)
  },

  // Medicamentos
  {
    path: 'medicamentos',
    loadComponent: () =>
      import('./Medication/components/medication-search/medication-search')
        .then(m => m.MedicationSearch)
  },

  // Cuestionarios: SOLO PACIENTES
  {
    path: 'mis-cuestionarios',
    canActivate: [roleGuard(['PATIENT'])],
    component: PatientQuestionnaires
  },

  // Cuestionarios: SOLO MÉDICOS
  {
    path: 'gestionar-cuestionarios',
    canActivate: [roleGuard(['DOCTOR'])],
    component: DoctorQuestionnaires
  },

  // Historial propio: SOLO PACIENTES
  {
    path: 'historial-cuestionarios',
    canActivate: [roleGuard(['PATIENT'])],
    data: { mode: 'patient' },
    component: QuestionnaireHistory
  },

  // Historial de pacientes vinculados: SOLO MÉDICOS
  {
    path: 'historial-cuestionarios-pacientes',
    canActivate: [roleGuard(['DOCTOR'])],
    data: { mode: 'doctor' },
    component: QuestionnaireHistory
  },

  // Administración
  {
    path: 'admin',
    canActivate: [adminGuard],
    component: PanelAdmin
  },
  
  // Doctor
  {path: 'perfil-medico', canActivate: [doctorGuard],loadComponent: () =>
    import('./Doctor/components/doctor-profile/doctor-profile').then((m) => m.DoctorProfile)},
  {path: 'medicos', canActivate: [patientGuard], loadComponent: () =>
    import('./Doctor/components/doctor-search/doctor-search').then((m) => m.DoctorSearch)},

  {path: 'medical-record', canActivate: [roleGuard(['PATIENT'])], component: MyMedicalRecord},
  {path: 'patient-medical-record/:patientId', canActivate: [roleGuard(['DOCTOR'])], component:PatientMedicalRecord},

  // Paciente
{path: 'perfil-paciente', canActivate: [patientGuard], loadComponent: () =>
    import('./Patient/components/patient-profile/patient-profile').then((m) => m.PatientProfile)},
{path: 'mis-pacientes', canActivate: [doctorGuard], loadComponent: () =>
    import('./Patient/components/my-patients/my-patients').then((m) => m.MyPatients)},

  // Tratamientos
{path: 'mis-tratamientos', canActivate: [patientGuard], loadComponent: () =>
    import('./Treatment/components/treatments/treatments').then((m) => m.Treatments)},
{path: 'pacientes/:patientId/tratamientos', canActivate: [doctorGuard], loadComponent: () =>
    import('./Treatment/components/treatments/treatments').then((m) => m.Treatments)},

  // Ruta inexistente
  { path: '**', redirectTo: 'home' }
];