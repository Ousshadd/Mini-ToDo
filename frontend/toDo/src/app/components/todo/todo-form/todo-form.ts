import { Component, input, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../services/category';

@Component({
  selector: 'app-todo-form',
  imports: [FormsModule],
  templateUrl: './todo-form.html',
  styleUrl: './todo-form.css',
})
export class TodoFormComponent {
  categories = input<Category[]>([]);
  todoSubmit = output<{ title: string; description: string; priority: string; dueDate: string | null; categoryId: string | null }>();

  title = '';
  description = '';
  priority = 'moyenne';
  dueDate = '';
  categoryId = '';

  onSubmit() {
    if (this.title.trim()) {
      this.todoSubmit.emit({ 
        title: this.title, 
        description: this.description,
        priority: this.priority,
        dueDate: this.dueDate || null,
        categoryId: this.categoryId || null
      });
      this.title = '';
      this.description = '';
      this.priority = 'moyenne';
      this.dueDate = '';
      this.categoryId = '';
    }
  }
}
