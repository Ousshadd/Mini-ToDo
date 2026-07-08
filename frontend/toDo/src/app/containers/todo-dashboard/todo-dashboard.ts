import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TodoService, Todo } from '../../services/todo';
import { CategoryService, Category } from '../../services/category';
import { TodoListComponent } from '../../components/todo/todo-list/todo-list';
import { TodoFormComponent } from '../../components/todo/todo-form/todo-form';
import { Navbar } from '../../components/layout/navbar/navbar';

@Component({
  selector: 'app-todo-dashboard',
  imports: [TodoListComponent, TodoFormComponent, Navbar, FormsModule],
  templateUrl: './todo-dashboard.html',
  styleUrl: './todo-dashboard.css',
})
export class TodoDashboard implements OnInit {
  private todoService = inject(TodoService);
  private categoryService = inject(CategoryService);

  todos = signal<Todo[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  selectedCategoryId = signal<string | null>(null);

  // New category form
  showCategoryForm = signal(false);
  newCategoryName = '';
  newCategoryColor = '#6366f1';
  newCategoryIcon = '📁';

  filteredTodos = computed(() => {
    const catId = this.selectedCategoryId();
    const allTodos = this.todos();
    if (!catId) return allTodos;
    return allTodos.filter(t => t.categoryId === catId);
  });

  ngOnInit() {
    this.loadTodos();
    this.loadCategories();
  }

  loadTodos() {
    this.isLoading.set(true);
    this.todoService.getTodos().subscribe({
      next: (data) => {
        this.todos.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Erreur lors du chargement des tâches.');
        this.isLoading.set(false);
      },
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des catégories.', err);
      },
    });
  }

  selectCategory(catId: string | null) {
    this.selectedCategoryId.set(
      this.selectedCategoryId() === catId ? null : catId
    );
  }

  toggleCategoryForm() {
    this.showCategoryForm.update(v => !v);
  }

  onAddCategory() {
    if (!this.newCategoryName.trim()) return;

    this.categoryService.addCategory({
      name: this.newCategoryName,
      color: this.newCategoryColor,
      icon: this.newCategoryIcon,
    }).subscribe({
      next: (res) => {
        this.categories.update(cats => [res.category, ...cats]);
        this.newCategoryName = '';
        this.newCategoryColor = '#6366f1';
        this.newCategoryIcon = '📁';
        this.showCategoryForm.set(false);
      },
      error: () => {
        this.errorMessage.set("Erreur lors de l'ajout de la catégorie.");
      }
    });
  }

  onDeleteCategory(catId: string) {
    const previousCategories = this.categories();
    this.categories.update(cats => cats.filter(c => c._id !== catId));

    if (this.selectedCategoryId() === catId) {
      this.selectedCategoryId.set(null);
    }

    this.categoryService.deleteCategory(catId).subscribe({
      error: () => {
        this.categories.set(previousCategories);
        this.errorMessage.set('Erreur lors de la suppression de la catégorie.');
      }
    });
  }

  onAddTodo(data: { title: string; description: string; priority: string; dueDate: string | null; categoryId: string | null }) {
    this.todoService.addTodo(data).subscribe({
      next: (res) => {
        this.todos.update(todos => [res.todo, ...todos]);
      },
      error: (err) => {
        this.errorMessage.set('Erreur lors de l\'ajout de la tâche.');
      }
    });
  }

  onChangeStatus(event: { todo: Todo, newStatus: 'à faire' | 'en cours' | 'terminé' }) {
    const { todo, newStatus } = event;
    if (!todo._id) return;
    
    const previousStatus = todo.status;
    
    // Optimistic update
    this.todos.update(todos => 
      todos.map(t => t._id === todo._id ? { ...t, status: newStatus } : t)
    );

    this.todoService.updateTodo(todo._id, { status: newStatus }).subscribe({
      error: () => {
        // Revert on error
        this.todos.update(todos => 
          todos.map(t => t._id === todo._id ? { ...t, status: previousStatus } : t)
        );
        this.errorMessage.set('Erreur lors de la mise à jour de la tâche.');
      }
    });
  }

  onEditTodo(event: { id: string, data: Partial<Todo> }) {
    const { id, data } = event;
    const previousTodos = this.todos();

    // Optimistic update
    this.todos.update(todos => 
      todos.map(t => t._id === id ? { ...t, ...data } : t)
    );

    this.todoService.updateTodo(id, data).subscribe({
      error: () => {
        // Revert on error
        this.todos.set(previousTodos);
        this.errorMessage.set('Erreur lors de la modification de la tâche.');
      }
    });
  }

  onDeleteTodo(id: string) {
    // Optimistic update
    const previousTodos = this.todos();
    this.todos.update(todos => todos.filter(t => t._id !== id));

    this.todoService.deleteTodo(id).subscribe({
      error: () => {
        // Revert on error
        this.todos.set(previousTodos);
        this.errorMessage.set('Erreur lors de la suppression de la tâche.');
      }
    });
  }
}
