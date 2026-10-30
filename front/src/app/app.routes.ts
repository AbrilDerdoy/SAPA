import { Routes } from '@angular/router';

import { Home } from './home/home';
import { Forum } from './forum/forum-component/forum/forum';

import { Registro } from './Usuario/components/registro/registro';
import { Login } from './Usuario/components/login/login';
import { ForgotPassword } from './Usuario/components/forgot-password/forgot-password';
import { ResetPassword } from './Usuario/components/reset-password/reset-password';

export const routes: Routes = [
  {path: '',redirectTo: 'home',pathMatch: 'full'},
  {path: 'register',component: Registro},
  {path: 'login',component: Login},
  {path: 'home',component: Home},
  {path: 'forums',component: Forum},
  {path: 'forgotPassword',component: ForgotPassword},
  {path: 'resetPassword',component: ResetPassword},
  {path: 'chat',loadChildren: () =>import('./Chat/chat.routes').then(m => m.chatRoutes)}
];
