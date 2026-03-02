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
   * Ambil list task dalam sebuah project
   *
   * @param projectId - Project ID
   * @param page - Nomor halaman
   * @param perPage - Item per halaman
   * @param status - Filter status task
   * @param priority - Filter priority task
   */
  getTasks(
    projectId: number,
    page = 1,
    perPage = 20,
    status?: string,
    priority?: string
  ): Observable<ApiResponse<PaginatedResponse<Task>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (status) params = params.set('status', status);
    if (priority) params = params.set('priority', priority);

    return this.http.get<ApiResponse<PaginatedResponse<Task>>>(
      `${this.baseUrl}/projects/${projectId}/tasks`,
      { params }
    );
  }

  /**
   * Ambil detail single task
   *
   * @param id - Task ID
   */
  getTask(id: number): Observable<ApiResponse<{ task: Task }>> {
    return this.http.get<ApiResponse<{ task: Task }>>(`${this.baseUrl}/tasks/${id}`);
  }

  /**
   * Buat task baru
   *
   * @param data - Task data (project_id wajib, title wajib)
   */
  createTask(data: {
    project_id: number;
    title: string;
    description?: string;
    assigned_to?: number;
    priority?: string;
    due_date?: string;
    /** Initial status — slug dari project_statuses (default: slug pertama di project) */
    status?: string;
  }): Observable<ApiResponse<{ task: Task }>> {
    return this.http.post<ApiResponse<{ task: Task }>>(`${this.baseUrl}/tasks`, data);
  }

  /**
   * Update data task
   *
   * @param id - Task ID
   * @param data - Field yang ingin diupdate
   */
  updateTask(id: number, data: Partial<Task>): Observable<ApiResponse<{ task: Task }>> {
    return this.http.put<ApiResponse<{ task: Task }>>(`${this.baseUrl}/tasks/${id}`, data);
  }

  /**
   * Update status task saja (PATCH — lebih efisien dari full update)
   * Mendukung slug custom status selain 'todo', 'in_progress', 'done'.
   *
   * @param id - Task ID
   * @param status - Slug status baru (dari project_statuses)
   */
  updateTaskStatus(id: number, status: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/tasks/${id}/status`, { status });
  }

  /**
   * Hapus task
   *
   * @param id - Task ID
   */
  deleteTask(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/tasks/${id}`);
  }

  /**
   * Ambil activity logs sebuah task (riwayat perubahan)
   *
   * @param id - Task ID
   */
  getTaskLogs(id: number): Observable<ApiResponse<{ logs: TaskActivityLog[] }>> {
    return this.http.get<ApiResponse<{ logs: TaskActivityLog[] }>>(`${this.baseUrl}/tasks/${id}/logs`);
  }
}
