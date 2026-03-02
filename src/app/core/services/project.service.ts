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

  constructor(private http: HttpClient) {}

  /**
   * Ambil list semua project dengan pagination dan filter opsional
   *
   * @param page - Nomor halaman (default 1)
   * @param perPage - Jumlah item per halaman (default 10)
   * @param status - Filter status ('active' | 'completed' | undefined)
   * @returns Observable<ApiResponse<PaginatedResponse<Project>>>
   */
  getProjects(page = 1, perPage = 10, status?: string): Observable<ApiResponse<PaginatedResponse<Project>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiResponse<PaginatedResponse<Project>>>(this.baseUrl, { params });
  }

  /**
   * Ambil detail sebuah project beserta daftar member dan statistik task
   *
   * @param id - Project ID
   */
  getProject(id: number): Observable<ApiResponse<{ project: Project; members: any[]; task_counts: any }>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Buat project baru (Manager/Admin only)
   *
   * @param data - { name, description?, deadline? }
   */
  createProject(data: { name: string; description?: string; deadline?: string }): Observable<ApiResponse<{ project: Project }>> {
    return this.http.post<ApiResponse<{ project: Project }>>(this.baseUrl, data);
  }

  /**
   * Update data project
   *
   * @param id - Project ID
   * @param data - Field yang ingin diupdate
   */
  updateProject(id: number, data: Partial<Project>): Observable<ApiResponse<{ project: Project }>> {
    return this.http.put<ApiResponse<{ project: Project }>>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Hapus project (Admin only)
   *
   * @param id - Project ID
   */
  deleteProject(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Tambah user sebagai anggota project
   *
   * @param projectId - Project ID
   * @param userId - User ID yang akan ditambahkan
   */
  addMember(projectId: number, userId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/${projectId}/members`, { user_id: userId });
  }

  /**
   * Hapus user dari anggota project
   *
   * @param projectId - Project ID
   * @param userId - User ID yang akan dihapus
   */
  removeMember(projectId: number, userId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${projectId}/members/${userId}`);
  }
}
