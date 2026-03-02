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
     * GET /users
     *
     * Mengambil semua user aktif di sistem.
     * Digunakan untuk dropdown "Assign To" saat membuat task.
     *
     * Output: Observable<ApiResponse<{ users: User[] }>>
     */
    getUsers(): Observable<ApiResponse<{ users: User[] }>> {
        return this.http.get<ApiResponse<{ users: User[] }>>(
            `${environment.apiUrl}/users`
        );
    }

    /**
     * GET /users/me
     *
     * Mengambil profil user yang sedang login berdasarkan JWT token.
     *
     * Output: Observable<ApiResponse<{ user: User }>>
     */
    getMe(): Observable<ApiResponse<{ user: User }>> {
        return this.http.get<ApiResponse<{ user: User }>>(
            `${environment.apiUrl}/users/me`
        );
    }
}
