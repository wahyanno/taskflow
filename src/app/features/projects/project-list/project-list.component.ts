import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/models';

/**
 * ProjectListComponent — Displays the paginated list of all projects.
 *
 * Features:
 * - Project list with pagination
 * - Filter by status (active / completed)
 * - Inline modal form for creating a new project (Manager / Admin)
 * - Delete confirmation for projects (Admin only) via SweetAlert2
 */
@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit, OnDestroy {
  projects: Project[] = [];
  isLoading = true;
  showCreateModal = false;
  isSubmitting = false;

  /** Pagination state */
  currentPage = 1;
  totalPages = 1;
  total = 0;

  /** Filter state */
  statusFilter = '';

  /** Subject used to cancel subscriptions on component destroy */
  private destroy$ = new Subject<void>();

  /** Reactive form for creating a new project */
  projectForm: FormGroup;

  /** Current user — used for role-based UI rendering */
  currentUser = this.authService.getCurrentUser();

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      deadline: ['']
    });
  }

  ngOnInit(): void {
    this.loadProjects();
  }

  /**
   * Cancel all active subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get name() { return this.projectForm.get('name')!; }

  /** Check if the current user can create projects (Admin / Manager) */
  get canCreateProject(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'manager';
  }

  /** Check if the current user can delete projects (Admin only) */
  get canDeleteProject(): boolean {
    return this.currentUser?.role === 'admin';
  }

  /**
   * Fetch the project list from the API with pagination and filter applied.
   */
  loadProjects(): void {
    this.isLoading = true;
    this.projectService.getProjects(this.currentPage, 10, this.statusFilter || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.status === 'success') {
            this.projects = res.data.items;
            this.total = res.data.total;
            this.totalPages = res.data.total_pages;
          }
        },
        error: (err) => {
          this.isLoading = false;
          Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to load projects.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  /**
   * Navigate to a specific page (pagination).
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProjects();
  }

  /**
   * Apply the current filter and reload from page 1.
   */
  applyFilter(): void {
    this.currentPage = 1;
    this.loadProjects();
  }

  /**
   * Submit the create-project form.
   */
  onCreateProject(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = this.projectForm.value;

    this.projectService.createProject({
      name: formVal.name,
      description: formVal.description,
      deadline: formVal.deadline || undefined
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.status === 'success') {
            this.showCreateModal = false;
            this.projectForm.reset();
            Swal.fire({ icon: 'success', title: 'Project created!', text: `"${res.data.project.name}" has been created successfully.`, confirmButtonColor: '#6366f1', timer: 2000, showConfirmButton: false });
            this.loadProjects();
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          Swal.fire({ icon: 'error', title: 'Failed to create project', text: err.error?.message || 'An error occurred. Please try again.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  /**
   * Show a SweetAlert2 confirmation dialog, then soft-delete the project (Admin only).
   */
  async onDeleteProject(project: Project): Promise<void> {
    const result = await Swal.fire({
      title: 'Delete Project?',
      html: `Are you sure you want to delete <strong>"${project.name}"</strong>?<br><small>All tasks in this project will also be deleted.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    this.projectService.deleteProject(project.id).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Project has been deleted successfully.', confirmButtonColor: '#6366f1', timer: 2000, showConfirmButton: false });
        this.loadProjects();
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'Failed to delete', text: err.error?.message || 'An error occurred. Please try again.', confirmButtonColor: '#6366f1' });
      }
    });
  }
}
