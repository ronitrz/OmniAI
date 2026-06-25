// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { WorkspaceListComponent } from './features/workspace/workspace-list/workspace-list.component';
import { WorkspaceDetailComponent } from './features/workspace/workspace-detail/workspace-detail.component';
import { ChatComponent } from './features/chat/chat.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      { path: '', component: ChatComponent },
      { path: 'login', component: ChatComponent },
      { path: 'register', component: ChatComponent },
      { path: 'workspace/:id', component: WorkspaceDetailComponent, canActivate: [authGuard] },
      { path: 'session/:id', component: ChatComponent, canActivate: [authGuard] }
    ]
  },
  { path: '**', redirectTo: '' }
];
