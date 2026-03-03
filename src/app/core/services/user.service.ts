import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, User } from '../models/models';

/**
 * UserService - Mengelola data user dari API
 *
 * Menyediakan method untuk:
 * - Ambil semua user aktif (untuk dropdown assign task)
 * - Ambil profil user yang sedang login
 */
@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(private http: HttpClient) { }

    /**
     * POST /users/list
     * Mengambil semua user aktif di sistem
     */
    getUsers(): Observable<ApiResponse<{ users: User[] }>> {
        return this.http.post<ApiResponse<{ users: User[] }>>(
            `${environment.apiUrl}/user/index`,
            {}
        );
    }

    /**
     * POST /users/me
     * Mengambil profil user yang sedang login
     */
    getMe(): Observable<ApiResponse<{ user: User }>> {
        return this.http.post<ApiResponse<{ user: User }>>(
            `${environment.apiUrl}/user/me`,
            {}
        );
    }

    /**
     * POST /users/update-profile
     * Update profil user login
     */
    updateProfile(data: Partial<User>): Observable<ApiResponse<{ user: User }>> {
        return this.http.post<ApiResponse<{ user: User }>>(
            `${environment.apiUrl}/user/update-profile`,
            data
        );
    }
}
