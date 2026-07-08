import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Todo {
  _id?: string;
  title: string;
  description: string;
  priority: 'basse' | 'moyenne' | 'haute';
  status: 'à faire' | 'en cours' | 'terminé';
  dueDate?: Date | string | null;
  categoryId?: string | null;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class TodoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/todos';

  getTodos(): Observable<Todo[]> {
    return this.http.get<Todo[]>(this.apiUrl);
  }

  getTodo(id: string): Observable<Todo> {
    return this.http.get<Todo>(`${this.apiUrl}/${id}`);
  }

  addTodo(todo: { title: string; description: string; priority?: string; dueDate?: string | Date | null }): Observable<{ message: string; todo: Todo }> {
    return this.http.post<{ message: string; todo: Todo }>(this.apiUrl, todo);
  }

  updateTodo(id: string, todo: Partial<Todo>): Observable<{ message: string; todo: Todo }> {
    return this.http.put<{ message: string; todo: Todo }>(`${this.apiUrl}/${id}`, todo);
  }

  deleteTodo(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
