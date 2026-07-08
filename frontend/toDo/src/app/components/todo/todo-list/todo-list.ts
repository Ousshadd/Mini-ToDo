import { Component, input, output } from '@angular/core';
import { Todo } from '../../../services/todo';
import { Category } from '../../../services/category';
import { TodoItemComponent } from '../todo-item/todo-item';

@Component({
  selector: 'app-todo-list',
  imports: [TodoItemComponent],
  templateUrl: './todo-list.html',
  styleUrl: './todo-list.css',
})
export class TodoListComponent {
  todos = input.required<Todo[]>();
  categories = input<Category[]>([]);

  statusChange = output<{ todo: Todo, newStatus: 'à faire' | 'en cours' | 'terminé' }>();
  deleteTodo = output<string>();
  editTodo = output<{ id: string, data: Partial<Todo> }>();

  onStatusChange(event: { todo: Todo, newStatus: 'à faire' | 'en cours' | 'terminé' }) {
    this.statusChange.emit(event);
  }

  onEditTodo(event: { id: string, data: Partial<Todo> }) {
    this.editTodo.emit(event);
  }

  onDelete(id: string) {
    this.deleteTodo.emit(id);
  }
}
