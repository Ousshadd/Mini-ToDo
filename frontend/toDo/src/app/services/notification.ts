import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TaskNotification {
  id: string;
  todoId: string;
  title: string;
  message: string;
  type: 'overdue' | 'due_soon';
  dueDate: string;
  read: boolean;
}

export interface NotificationResponse {
  notifications: TaskNotification[];
  unreadCount: number;
  generatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = '/api/notifications';

  getNotifications(): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(this.apiUrl);
  }

  markAsRead(todoId: string): Observable<{ message: string; todoId: string }> {
    return this.http.put<{ message: string; todoId: string }>(
      `${this.apiUrl}/${todoId}/read`,
      {}
    );
  }

  dismiss(todoId: string): Observable<{ message: string; todoId: string }> {
    return this.http.delete<{ message: string; todoId: string }>(`${this.apiUrl}/${todoId}`);
  }
}
