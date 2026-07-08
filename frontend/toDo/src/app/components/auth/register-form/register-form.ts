import { Component, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register-form',
  imports: [FormsModule],
  templateUrl: './register-form.html',
  styleUrl: './register-form.css',
})
export class RegisterForm {
  registerSubmit = output<{ name: string; email: string; password: string }>();

  name = '';
  email = '';
  password = '';

  onSubmit() {
    if (this.name && this.email && this.password) {
      this.registerSubmit.emit({ name: this.name, email: this.email, password: this.password });
    }
  }
}
