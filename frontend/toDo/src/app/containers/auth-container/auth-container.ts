import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth } from '../../services/auth';
import { LoginForm } from '../../components/auth/login-form/login-form';
import { RegisterForm } from '../../components/auth/register-form/register-form';
import { Navbar } from '../../components/layout/navbar/navbar';

@Component({
  selector: 'app-auth-container',
  imports: [LoginForm, RegisterForm, Navbar],
  templateUrl: './auth-container.html',
  styleUrl: './auth-container.css',
})
export class AuthContainer {
  private authService = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoginMode = signal(true);
  errorMessage = signal('');
  isLoading = signal(false);

  constructor() {
    // Determine mode from the route
    const url = this.router.url;
    this.isLoginMode.set(url !== '/register');
  }

  onLogin(credentials: { email: string; password: string }) {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(credentials.email, credentials.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/todos']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Erreur de connexion.');
      },
    });
  }

  onRegister(data: { name: string; email: string; password: string }) {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(data.name, data.email, data.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/todos']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || "Erreur lors de l'inscription.");
      },
    });
  }
}
