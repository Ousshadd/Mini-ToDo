import { Component, input, output, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Todo } from '../../../services/todo';
import { Category } from '../../../services/category';

@Component({
  selector: 'app-todo-item',
  imports: [DatePipe, FormsModule],
  templateUrl: './todo-item.html',
  styleUrl: './todo-item.css',
})
export class TodoItemComponent implements OnInit {
  todo = input.required<Todo>();
  categories = input<Category[]>([]);

  statusChange = output<{ todo: Todo, newStatus: 'à faire' | 'en cours' | 'terminé' }>();
  deleteTodo = output<string>();
  editTodo = output<{ id: string, data: Partial<Todo> }>();

  isEditing = false;
  editData: Partial<Todo> = {};

  ngOnInit() {
    this.resetEditData();
  }

  resetEditData() {
    const t = this.todo();
    // Use string type for dueDate in inputs, formatting it as YYYY-MM-DD
    let formattedDate = null;
    if (t.dueDate) {
      formattedDate = new Date(t.dueDate).toISOString().split('T')[0];
    }
    this.editData = {
      title: t.title,
      description: t.description,
      priority: t.priority,
      dueDate: formattedDate,
      categoryId: t.categoryId || null
    };
  }

  getCategoryForTodo(): Category | undefined {
    const catId = this.todo().categoryId;
    if (!catId) return undefined;
    return this.categories().find(c => c._id === catId);
  }

  onEditClick() {
    this.resetEditData();
    this.isEditing = true;
  }

  onCancelEdit() {
    this.isEditing = false;
  }

  onSaveEdit() {
    if (this.editData.title?.trim()) {
      const id = this.todo()._id;
      if (id) {
        this.editTodo.emit({ id, data: this.editData });
      }
      this.isEditing = false;
    }
  }

  onStatusChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as 'à faire' | 'en cours' | 'terminé';
    this.statusChange.emit({ todo: this.todo(), newStatus });
  }

  onDelete() {
    const id = this.todo()._id;
    if (id) {
      this.deleteTodo.emit(id);
    }
  }
}
