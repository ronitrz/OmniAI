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
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: WorkspaceListComponent },
      { path: 'workspace/:id', component: WorkspaceDetailComponent },
      { path: 'session/:id', component: ChatComponent }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
