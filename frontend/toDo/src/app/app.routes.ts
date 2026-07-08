import { Routes } from '@angular/router';
import { AuthContainer } from './containers/auth-container/auth-container';
import { TodoDashboard } from './containers/todo-dashboard/todo-dashboard';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: 'login', component: AuthContainer, title: 'Login' },
  { path: 'register', component: AuthContainer, title: 'Register' },
  { 
    path: 'todos', 
    component: TodoDashboard, 
    canActivate: [authGuard],
    title: 'Mes Tâches' 
  },
  { path: '', redirectTo: '/todos', pathMatch: 'full' },
  { path: '**', redirectTo: '/todos' }
];

