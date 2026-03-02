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
     * GET /projects/:projectId/statuses
     *
     * Ambil semua custom status dalam sebuah project,
     * beserta jumlah task per status.
     *
     * Output: Observable<ApiResponse<{ statuses: ProjectStatus[], can_manage: boolean }>>
     */
    getStatuses(projectId: number): Observable<ApiResponse<{ statuses: ProjectStatus[]; can_manage: boolean }>> {
        return this.http.get<ApiResponse<{ statuses: ProjectStatus[]; can_manage: boolean }>>(
            `${environment.apiUrl}/projects/${projectId}/statuses`
        );
    }

    /**
     * POST /projects/:projectId/statuses
     *
     * Tambah status baru ke project.
     * Hanya admin/manager.
     *
     * Input  : { name: string, color?: string }
     * Output : Observable<ApiResponse<{ status: ProjectStatus }>>
     */
    createStatus(projectId: number, payload: { name: string; color?: string }): Observable<ApiResponse<{ status: ProjectStatus }>> {
        return this.http.post<ApiResponse<{ status: ProjectStatus }>>(
            `${environment.apiUrl}/projects/${projectId}/statuses`,
            payload
        );
    }

    /**
     * PUT /projects/:projectId/statuses/:statusId
     *
     * Edit nama atau warna status.
     * Slug tidak bisa diubah (menjaga konsistensi task existing).
     *
     * Input  : { name?: string, color?: string }
     * Output : Observable<ApiResponse<{ status: ProjectStatus }>>
     */
    updateStatus(projectId: number, statusId: number, payload: { name?: string; color?: string }): Observable<ApiResponse<{ status: ProjectStatus }>> {
        return this.http.put<ApiResponse<{ status: ProjectStatus }>>(
            `${environment.apiUrl}/projects/${projectId}/statuses/${statusId}`,
            payload
        );
    }

    /**
     * DELETE /projects/:projectId/statuses/:statusId
     *
     * Hapus status dari project.
     * Akan gagal jika masih ada task di status itu.
     *
     * Output : Observable<ApiResponse<{ deleted: boolean }>>
     */
    deleteStatus(projectId: number, statusId: number): Observable<ApiResponse<{ deleted: boolean }>> {
        return this.http.delete<ApiResponse<{ deleted: boolean }>>(
            `${environment.apiUrl}/projects/${projectId}/statuses/${statusId}`
        );
    }

    /**
     * PUT /projects/:projectId/statuses/reorder
     *
     * Simpan urutan baru status. Menerima array ID status dalam urutan yang diinginkan.
     * Backend akan update kolom `position` berdasarkan index array.
     *
     * @param projectId  - ID project
     * @param order      - Array of status ID sesuai urutan baru (index 0 = posisi pertama)
     *
     * Output : Observable<ApiResponse<{ reordered: boolean, statuses: ProjectStatus[] }>>
     */
    reorderStatuses(projectId: number, order: number[]): Observable<ApiResponse<{ reordered: boolean; statuses: ProjectStatus[] }>> {
        return this.http.put<ApiResponse<{ reordered: boolean; statuses: ProjectStatus[] }>>(
            `${environment.apiUrl}/projects/${projectId}/statuses/reorder`,
            { order }
        );
    }
}
