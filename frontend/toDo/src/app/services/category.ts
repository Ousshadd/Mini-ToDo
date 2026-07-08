import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  _id?: string;
  name: string;
  color: string;
  icon: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = '/api/categories';

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  addCategory(category: { name: string; color?: string; icon?: string }): Observable<{ message: string; category: Category }> {
    return this.http.post<{ message: string; category: Category }>(this.apiUrl, category);
  }

  updateCategory(id: string, category: Partial<Category>): Observable<{ message: string; category: Category }> {
    return this.http.put<{ message: string; category: Category }>(`${this.apiUrl}/${id}`, category);
  }

  deleteCategory(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
