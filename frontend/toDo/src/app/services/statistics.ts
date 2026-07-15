import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WeeklyStatistic {
  week: string;
  created: number;
  completed: number;
}

export interface ProductivityStatistics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  weeklyEvolution: WeeklyStatistic[];
  generatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private http = inject(HttpClient);

  getStatistics(): Observable<ProductivityStatistics> {
    return this.http.get<ProductivityStatistics>('/api/statistics');
  }
}
