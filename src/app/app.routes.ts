import { Routes } from '@angular/router';
import { Registro } from './Usuario/registro/registro';
import { Login } from './Usuario/login/login';
import { Home } from './home/home';

export const routes: Routes = [
    {path:'',redirectTo:'home',pathMatch:'full'},
    {path:'register',component:Registro},
    {path:'login',component:Login},
    {path:'home',component:Home}
];
