
import { Routes } from '@angular/router';

import { roleGuard } from './FollowRequest/guards/role-guard';
import { adminGuard } from './Usuario/guards/admin-guard';

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
    canActivate: [roleGuard(['PATIENT', 'TUTOR'])],
    data: { mode: 'patient' },
    loadComponent: () =>
      import('./FollowRequest/components/follow-requests/follow-requests')
        .then(m => m.FollowRequests)
  },

  // Tutor
  {
    path: 'tutor',
    pathMatch: 'full',
    canActivate: [roleGuard(['TUTOR'])],
    loadComponent: () =>
      import('./Tutor/components/tutor-dashboard/tutor-dashboard')
        .then(m => m.TutorDashboard)
  },
  {
    path: 'tutor/patients/:patientId/profile',
    canActivate: [roleGuard(['TUTOR'])],
    loadComponent: () =>
      import('./Tutor/components/tutor-patient-profile/tutor-patient-profile')
        .then(m => m.TutorPatientProfile)
  },
  {
    path: 'tutor-invitation',
    loadComponent: () =>
      import('./Tutor/components/tutor-invitation/tutor-invitation')
        .then(m => m.TutorInvitation)
  },

  // Medicamentos
  {
    path: 'medicamentos',
    loadComponent: () =>
      import('./Medication/components/medication-search/medication-search')
        .then(m => m.MedicationSearch)
  },

  // Cuestionarios: PACIENTES Y TUTORES
  {
    path: 'mis-cuestionarios',
    canActivate: [roleGuard(['PATIENT', 'TUTOR'])],
    component: PatientQuestionnaires
  },

  // Cuestionarios: SOLO MÉDICOS
  {
    path: 'gestionar-cuestionarios',
    canActivate: [roleGuard(['DOCTOR'])],
    component: DoctorQuestionnaires
  },

  // Historial propio: PACIENTES Y TUTORES
  {
    path: 'historial-cuestionarios',
    canActivate: [roleGuard(['PATIENT', 'TUTOR'])],
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
  {path: 'medical-record', canActivate: [roleGuard(['PATIENT', 'TUTOR'])],
    loadComponent: () => import('./medical-record/components/my-medical-record/my-medical-record')
    .then(m => m.MyMedicalRecord)},
  {path: 'patient-medical-record/:patientId', canActivate: [roleGuard(['DOCTOR', 'TUTOR'])],
    loadComponent: () => import('./medical-record/components/patient-medical-record/patient-medical-record')
    .then(m => m.PatientMedicalRecord)},
  {path: 'my-patients', canActivate: [roleGuard(['DOCTOR'])],
    loadComponent: () => import('./medical-record/components/doctor-patients/doctor-patients')
    .then(m => m.DoctorPatients)},
  // Ruta inexistente
  { path: '**', redirectTo: 'home' }
];
