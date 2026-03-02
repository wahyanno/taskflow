import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/models';

/**
 * ProjectListComponent - Menampilkan daftar semua project
 *
 * Features:
 * - List project dengan pagination
 * - Filter by status (active/completed)
 * - Modal inline form untuk buat project baru (Manager/Admin)
 * - Konfirmasi hapus project (Admin only) via SweetAlert2
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

  /** Subject untuk cancel subscriptions saat component destroyed */
  private destroy$ = new Subject<void>();

  /** Form untuk buat project baru */
  projectForm: FormGroup;

  /** Current user info untuk cek role */
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
   * Lifecycle hook: cancel semua subscription saat component destroyed.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get name() { return this.projectForm.get('name')!; }

  /**
   * Cek apakah user bisa membuat project (Admin/Manager)
   */
  get canCreateProject(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'manager';
  }

  /**
   * Cek apakah user bisa menghapus project (Admin only)
   */
  get canDeleteProject(): boolean {
    return this.currentUser?.role === 'admin';
  }

  /**
   * Load list project dari API dengan pagination dan filter
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
          Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Gagal memuat project.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  /**
   * Ubah halaman (pagination)
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProjects();
  }

  /**
   * Terapkan filter dan reload
   */
  applyFilter(): void {
    this.currentPage = 1;
    this.loadProjects();
  }

  /**
   * Submit form buat project baru
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
            Swal.fire({ icon: 'success', title: 'Project dibuat!', text: `Project "${res.data.project.name}" berhasil dibuat.`, confirmButtonColor: '#6366f1', timer: 2000, showConfirmButton: false });
            this.loadProjects();
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          Swal.fire({ icon: 'error', title: 'Gagal membuat project', text: err.error?.message || 'Terjadi kesalahan.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  /**
   * Konfirmasi dan hapus project (Admin only)
   * Menggunakan SweetAlert2 confirmation modal
   */
  async onDeleteProject(project: Project): Promise<void> {
    const result = await Swal.fire({
      title: 'Hapus Project?',
      html: `Anda yakin ingin menghapus project <strong>"${project.name}"</strong>?<br><small>Semua task dalam project ini juga akan terhapus.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    this.projectService.deleteProject(project.id).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Project berhasil dihapus.', confirmButtonColor: '#6366f1', timer: 2000, showConfirmButton: false });
        this.loadProjects();
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'Gagal menghapus', text: err.error?.message || 'Terjadi kesalahan.', confirmButtonColor: '#6366f1' });
      }
    });
  }
}
