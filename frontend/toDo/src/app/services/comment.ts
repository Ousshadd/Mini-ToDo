import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Comment {
  id: number;
  content: string;
  todoId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  private http = inject(HttpClient);
  private apiUrl = '/api/comments';

  getComments(todoId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/task/${todoId}`);
  }

  addComment(todoId: string, content: string): Observable<{ message: string; comment: Comment }> {
    return this.http.post<{ message: string; comment: Comment }>(this.apiUrl, {
      todoId,
      content,
    });
  }

  updateComment(id: number, content: string): Observable<{ message: string; comment: Comment }> {
    return this.http.put<{ message: string; comment: Comment }>(`${this.apiUrl}/${id}`, {
      content,
    });
  }

  deleteComment(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
