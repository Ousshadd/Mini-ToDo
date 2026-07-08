import { Component, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-form',
  imports: [FormsModule],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css',
})
export class LoginForm {
  loginSubmit = output<{ email: string; password: string }>();

  email = '';
  password = '';

  onSubmit() {
    if (this.email && this.password) {
      this.loginSubmit.emit({ email: this.email, password: this.password });
    }
  }
}
