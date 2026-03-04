import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, Project, ProjectActivityLog } from '../models/models';

/**
 * ProjectService — API calls for project management
 *
 * Provides methods for:
 * - Listing projects (with pagination and filters)
 * - Fetching a single project's details
 * - Creating, updating, and deleting projects
 * - Managing project members
 * - Retrieving the project activity log
 *
 * All requests are automatically injected with the JWT token via JwtInterceptor.
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly baseUrl = `${environment.apiUrl}/project`;

  constructor(private http: HttpClient) { }

  /**
   * POST /project/index
   * Retrieve a paginated list of projects with optional filters.
   *
   * @param page    - Page number (default 1)
   * @param perPage - Items per page (default 10)
   * @param status  - Optional status filter (active / completed)
   */
  getProjects(page = 1, perPage = 10, status?: string): Observable<ApiResponse<PaginatedResponse<Project>>> {
    return this.http.post<ApiResponse<PaginatedResponse<Project>>>(`${this.baseUrl}/index`, {
      page,
      per_page: perPage,
      status
    });
  }

  /**
   * POST /project/view
   * Fetch a single project including members list and task statistics.
   *
   * @param id - Project ID
   */
  getProject(id: number): Observable<ApiResponse<{ project: Project; members: any[]; task_counts: any }>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/view`, { id });
  }

  /**
   * POST /project/create
   * Create a new project. Admin / Manager only.
   *
   * @param data - Project fields: name, description (optional), deadline (optional)
   */
  createProject(data: { name: string; description?: string; deadline?: string }): Observable<ApiResponse<{ project: Project }>> {
    return this.http.post<ApiResponse<{ project: Project }>>(`${this.baseUrl}/create`, data);
  }

  /**
   * POST /project/update
   * Update an existing project.
   *
   * @param id   - Project ID
   * @param data - Fields to update (partial Project object)
   */
  updateProject(id: number, data: Partial<Project>): Observable<ApiResponse<{ project: Project }>> {
    return this.http.post<ApiResponse<{ project: Project }>>(`${this.baseUrl}/update`, {
      id,
      ...data
    });
  }

  /**
   * POST /project/delete
   * Soft-delete a project. Admin only.
   *
   * @param id - Project ID
   */
  deleteProject(id: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/delete`, { id });
  }

  /**
   * POST /project/add-member
   * Add a user as a project member. Admin / Manager only.
   *
   * @param projectId - Project ID
   * @param userId    - User ID to add
   */
  addMember(projectId: number, userId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/add-member`, {
      project_id: projectId,
      user_id: userId
    });
  }

  /**
   * POST /project/remove-member
   * Remove a user from a project. Admin / Manager only.
   *
   * @param projectId - Project ID
   * @param userId    - User ID to remove
   */
  removeMember(projectId: number, userId: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/remove-member`, {
      project_id: projectId,
      user_id: userId
    });
  }

  /**
   * POST /project/logs
   * Retrieve the project activity log (audit trail of changes).
   *
   * @param projectId - Project ID
   * @returns Observable containing a list of ProjectActivityLog entries
   */
  getProjectLogs(projectId: number): Observable<ApiResponse<{ logs: ProjectActivityLog[] }>> {
    return this.http.post<ApiResponse<{ logs: ProjectActivityLog[] }>>(`${this.baseUrl}/logs`, {
      id: projectId
    });
  }
}
