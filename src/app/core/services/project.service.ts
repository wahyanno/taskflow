import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, Project } from '../models/models';

/**
 * ProjectService - Semua API call untuk manajemen project
 *
 * Menyediakan method untuk:
 * - Ambil list project (dengan pagination dan filter)
 * - Ambil detail project
 * - Buat project baru
 * - Update project
 * - Hapus project
 * - Kelola anggota project
 *
 * Semua request otomatis ter-inject JWT token via JwtInterceptor.
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) { }

  /**
   * POST /project/index
   * Ambil list semua project dengan pagination dan filter opsional
   */
  getProjects(page = 1, perPage = 10, status?: string): Observable<ApiResponse<PaginatedResponse<Project>>> {
    return this.http.post<ApiResponse<PaginatedResponse<Project>>>(`${environment.apiUrl}/project/index`, {
      page,
      per_page: perPage,
      status
    });
  }

  /**
   * POST /projects/view
   * Ambil detail sebuah project beserta daftar member dan statistik task
   */
  getProject(id: number): Observable<ApiResponse<{ project: Project; members: any[]; task_counts: any }>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/project/view`, { id });
  }

  /**
   * POST /projects/create
   * Buat project baru (Manager/Admin only)
   */
  createProject(data: { name: string; description?: string; deadline?: string }): Observable<ApiResponse<{ project: Project }>> {
    return this.http.post<ApiResponse<{ project: Project }>>(`${environment.apiUrl}/project/create`, data);
  }

  /**
   * POST /project/update
   * Update data project
   */
  updateProject(id: number, data: Partial<Project>): Observable<ApiResponse<{ project: Project }>> {
    return this.http.post<ApiResponse<{ project: Project }>>(`${environment.apiUrl}/project/update`, {
      id,
      ...data
    });
  }

  /**
   * POST /projects/delete
   * Hapus project (Admin only)
   */
  deleteProject(id: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/project/delete`, { id });
  }

  /**
   * POST /project/add-member
   * Tambah user sebagai anggota project
   */
  addMember(projectId: number, userId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/project/add-member`, {
      project_id: projectId,
      user_id: userId
    });
  }

  /**
   * POST /project/remove-member
   * Hapus user dari anggota project
   */
  removeMember(projectId: number, userId: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/project/remove-member`, {
      project_id: projectId,
      user_id: userId
    });
  }
}
