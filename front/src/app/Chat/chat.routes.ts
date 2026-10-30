
import { Routes } from '@angular/router';
import { ChatLayout } from './components/chat-layout/chat-layout';
import { chatAuthGuard } from './guards/chat-auth.guard';

export const chatRoutes: Routes = [
  {
    path: '',
    component: ChatLayout,
    // Solo se accede al chat si el usuario está autenticado.
    canActivate: [chatAuthGuard]
  }
];
