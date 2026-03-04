import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

/**
 * App Routing Module — defines all routes for the TaskFlow application.
 *
 * Route structure:
 * /                     → Landing page (public marketing page)
 * /auth/login           → Login page (public)
 * /auth/register        → Register page (public)
 * /dashboard            → Dashboard summary (protected — requires login)
 * /projects             → Project list (protected)
 * /projects/:id         → Project detail + task list (protected)
 *
 * Lazy loading is used throughout to optimize the bundle size.
 */
const routes: Routes = [

  // ==================== PUBLIC: Landing Page ====================
  {
    path: '',
    loadChildren: () =>
      import('./features/landing/landing.module').then(m => m.LandingModule)
  },

  // ==================== PUBLIC: Auth Routes ====================
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

  // Fallback: unknown routes redirect to landing
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
