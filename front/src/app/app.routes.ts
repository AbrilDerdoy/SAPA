import { Routes } from '@angular/router';
import { roleGuard } from './FollowRequest/guards/role-guard';

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
import { adminGuard } from './Usuario/guards/admin-guard';

export const routes: Routes = [
  {path: '',redirectTo: 'home',pathMatch: 'full'},
  {path: 'register',component: Registro},
  {path: 'login',component: Login},
  {path: 'home',component: Home},
  {path: 'forums', component: Forum},
  {path: 'forums/create', component: CreateForum},
  {path: 'forums/update/:titleForum', component: UpdateForum},
  {path: 'forums/:titleForum', component: Post},
  {path: 'saved', component: SavedPost},
  {path: 'forgotPassword',component: ForgotPassword},
  {path: 'resetPassword',component: ResetPassword},
  {path: 'profile',component:Profile},
  {path: 'chat',loadChildren: () =>import('./Chat/chat.routes').then(m => m.chatRoutes)},
  {path: 'solicitudes', canActivate: [roleGuard(['DOCTOR'])], data: { mode: 'doctor' },
    loadComponent: () => import('./FollowRequest/components/follow-requests/follow-requests').then((m) => m.FollowRequests)},
  {path: 'mis-solicitudes', canActivate: [roleGuard(['PATIENT'])], data: { mode: 'patient' },
    loadComponent: () => import('./FollowRequest/components/follow-requests/follow-requests').then((m) => m.FollowRequests)},
  {path: 'medicamentos', loadComponent: () => import('./Medication/components/medication-search/medication-search').then(
    (m) => m.MedicationSearch)},
  {path: 'admin', canActivate: [adminGuard],component:PanelAdmin}
];
