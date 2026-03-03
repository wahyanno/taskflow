import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, DashboardData } from '../models/models';

/**
 * DashboardService - Mengambil data statistik untuk halaman dashboard
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient) { }

  /**
   * POST /dashboard/index
   * Ambil data statistik dashboard (sesuai role user yang login)
   */
  getDashboard(): Observable<ApiResponse<DashboardData>> {
    return this.http.post<ApiResponse<DashboardData>>(`${environment.apiUrl}/dashboard/index`, {});
  }
}
