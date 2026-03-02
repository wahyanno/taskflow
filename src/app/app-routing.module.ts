import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

/**
 * App Routing Module - Mendefinisikan semua route aplikasi TaskFlow
 *
 * Struktur route:
 * /                     → redirect ke /dashboard
 * /auth/login           → Halaman login (public)
 * /auth/register        → Halaman register (public)
 * /dashboard            → Dashboard summary (protected - perlu login)
 * /projects             → List project (protected)
 * /projects/:id         → Detail project + task list (protected)
 * /projects/new         → Form buat project (protected)
 * /projects/:id/edit    → Form edit project (protected)
 *
 * Lazy loading digunakan untuk optimasi bundle size.
 */
const routes: Routes = [
  // Redirect root ke dashboard
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // ==================== AUTH ROUTES (Public) ====================
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then(m => m.AuthModule)
  },

  // ==================== PROTECTED ROUTES ====================
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'projects',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/projects/projects.module').then(m => m.ProjectsModule)
  },

  // Fallback: jika route tidak dikenal, redirect ke dashboard
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
