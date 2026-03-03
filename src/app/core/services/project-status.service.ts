import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ProjectStatus } from '../models/models';

/**
 * ProjectStatusService - Mengelola custom status per project
 *
 * Menyediakan method untuk:
 * - List semua status dalam sebuah project
 * - Tambah status baru
 * - Edit nama/warna status
 * - Hapus status (backend akan cek apakah ada task di status itu)
 */
@Injectable({
    providedIn: 'root'
})
export class ProjectStatusService {

    constructor(private http: HttpClient) { }

    /**
     * POST /projects/statuses/list
     * Ambil semua custom status dalam sebuah project
     */
    getStatuses(projectId: number): Observable<ApiResponse<{ statuses: ProjectStatus[]; can_manage: boolean }>> {
        return this.http.post<ApiResponse<{ statuses: ProjectStatus[]; can_manage: boolean }>>(
            `${environment.apiUrl}/project-status/index`,
            { id: projectId }
        );
    }

    /**
     * POST /projects/statuses/create
     * Tambah status baru ke project
     */
    createStatus(projectId: number, payload: { name: string; color?: string }): Observable<ApiResponse<{ status: ProjectStatus }>> {
        return this.http.post<ApiResponse<{ status: ProjectStatus }>>(
            `${environment.apiUrl}/project-status/create`,
            { id: projectId, ...payload }
        );
    }

    /**
     * POST /projects/statuses/update
     * Edit nama atau warna status
     */
    updateStatus(projectId: number, statusId: number, payload: { name?: string; color?: string }): Observable<ApiResponse<{ status: ProjectStatus }>> {
        return this.http.post<ApiResponse<{ status: ProjectStatus }>>(
            `${environment.apiUrl}/project-status/update`,
            { id: projectId, sid: statusId, ...payload }
        );
    }

    /**
     * POST /projects/statuses/delete
     * Hapus status dari project
     */
    deleteStatus(projectId: number, statusId: number): Observable<ApiResponse<{ deleted: boolean }>> {
        return this.http.post<ApiResponse<{ deleted: boolean }>>(
            `${environment.apiUrl}/project-status/delete`,
            { id: projectId, sid: statusId }
        );
    }

    /**
     * POST /projects/statuses/reorder
     * Simpan urutan baru status
     */
    reorderStatuses(projectId: number, order: number[]): Observable<ApiResponse<{ reordered: boolean; statuses: ProjectStatus[] }>> {
        return this.http.post<ApiResponse<{ reordered: boolean; statuses: ProjectStatus[] }>>(
            `${environment.apiUrl}/project-status/reorder`,
            { id: projectId, order }
        );
    }
}
