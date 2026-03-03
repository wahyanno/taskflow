import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, Task, TaskActivityLog } from '../models/models';

/**
 * TaskService - Semua API call untuk manajemen task
 *
 * Menyediakan method untuk:
 * - Ambil list task dalam project
 * - Ambil detail task
 * - Buat task baru
 * - Update task
 * - Update status task (endpoint khusus PATCH)
 * - Hapus task
 * - Ambil activity logs task
 */
@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  /**
   * POST /tasks/list
   * Ambil list task dalam sebuah project
   */
  getTasks(
    projectId: number,
    page = 1,
    perPage = 20,
    status?: string,
    priority?: string
  ): Observable<ApiResponse<PaginatedResponse<Task>>> {
    return this.http.post<ApiResponse<PaginatedResponse<Task>>>(
      `${environment.apiUrl}/task/index`,
      {
        project_id: projectId,
        page,
        per_page: perPage,
        status,
        priority
      }
    );
  }

  /**
   * POST /tasks/view
   * Ambil detail single task
   */
  getTask(id: number): Observable<ApiResponse<{ task: Task }>> {
    return this.http.post<ApiResponse<{ task: Task }>>(`${environment.apiUrl}/task/view`, { id });
  }

  /**
   * POST /tasks/create
   * Buat task baru
   */
  createTask(data: {
    project_id: number;
    title: string;
    description?: string;
    assigned_to?: number;
    priority?: string;
    due_date?: string;
    status?: string;
  }): Observable<ApiResponse<{ task: Task }>> {
    return this.http.post<ApiResponse<{ task: Task }>>(`${environment.apiUrl}/task/create`, data);
  }

  /**
   * POST /tasks/update
   * Update data task
   */
  updateTask(id: number, data: Partial<Task>): Observable<ApiResponse<{ task: Task }>> {
    return this.http.post<ApiResponse<{ task: Task }>>(`${environment.apiUrl}/task/update`, {
      id,
      ...data
    });
  }

  /**
   * POST /tasks/update-status
   * Update status task saja
   */
  updateTaskStatus(id: number, status: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/task/update-status`, {
      id,
      status
    });
  }

  /**
   * POST /tasks/delete
   * Hapus task
   */
  deleteTask(id: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/task/delete`, { id });
  }

  /**
   * POST /tasks/logs
   * Ambil activity logs sebuah task (riwayat perubahan)
   */
  getTaskLogs(id: number): Observable<ApiResponse<{ logs: TaskActivityLog[] }>> {
    return this.http.post<ApiResponse<{ logs: TaskActivityLog[] }>>(`${environment.apiUrl}/task/logs`, { id });
  }
}
