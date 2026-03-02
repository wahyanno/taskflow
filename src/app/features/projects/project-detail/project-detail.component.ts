import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ProjectStatusService } from '../../../core/services/project-status.service';
import { Project, Task, User, ProjectStatus } from '../../../core/models/models';

/**
 * ProjectDetailComponent - Detail project dan manajemen tasks
 *
 * Features:
 * - Tampilkan info project (nama, deadline, members)
 * - List tasks dengan filter status
 * - Modal form buat task baru
 * - Update status task (inline dropdown)
 * - Hapus task dengan konfirmasi SweetAlert2
 * - Badge priority dan status task
 */
@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  projectId!: number;
  project: Project | null = null;
  /** Member project ini (untuk ditampilkan di header) */
  members: User[] = [];
  /** Semua user aktif di sistem (untuk dropdown Assign To) */
  allUsers: User[] = [];
  tasks: Task[] = [];
  isLoadingProject = true;
  isLoadingTasks = true;

  /** Custom statuses project ini */
  projectStatuses: ProjectStatus[] = [];
  isLoadingStatuses = false;

  /**
   * Subject yang di-emit saat component di-destroy.
   * Semua subscription yang pakai takeUntil(this.destroy$) akan otomatis di-cancel.
   */
  private destroy$ = new Subject<void>();

  /** State modal buat task */
  showCreateTaskModal = false;
  isSubmittingTask = false;

  /** Filter tasks (hanya berlaku di table view) */
  taskStatusFilter = '';

  /** Mode tampilan: 'table' atau 'kanban' */
  viewMode: 'table' | 'kanban' = 'table';

  /** Task yang sedang di-drag (untuk kanban drag-drop) */
  draggedTask: Task | null = null;

  /** Kolom yang sedang di-hover saat drag (untuk highlight) */
  dragOverColumn: string | null = null;

  // ─── State: Manage Status Modal ────────────────────────────────────────────
  showStatusModal = false;
  /** Status yang sedang di-edit (null = mode tambah baru) */
  editingStatus: ProjectStatus | null = null;
  statusFormName = '';
  statusFormColor = 'gray';
  isSubmittingStatus = false;

  // ─── State: Drag-Drop Reorder Status List ───────────────────────────────────
  /** Status yang sedang di-drag di modal list */
  draggingStatusId: number | null = null;
  /** Status yang sedang di-hover saat drag (tujuan drop) */
  dragOverStatusId: number | null = null;
  /** Menyimpan urutan asli sebagai referensi rollback */
  private _statusOrderBeforeDrag: ProjectStatus[] = [];

  /** Form buat task */
  taskForm: FormGroup;

  /** User yang login */
  currentUser = this.authService.getCurrentUser();

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private taskService: TaskService,
    private authService: AuthService,
    private userService: UserService,
    private projectStatusService: ProjectStatusService,
    private fb: FormBuilder
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      assigned_to: [''],
      priority: ['medium'],
      due_date: [''],
      status: ['todo'],  // default slug 'todo', akan diupdate saat statuses loaded
    });
  }

  ngOnInit(): void {
    this.projectId = +this.route.snapshot.paramMap.get('id')!;
    this.loadProject();
    this.loadTasks();
    this.loadAllUsers();
    this.loadStatuses();
  }

  /**
   * Lifecycle hook: dipanggil saat component dihancurkan (navigasi pergi / logout).
   * Emit destroy$ agar semua subscription yang pakai takeUntil(destroy$) otomatis di-cancel,
   * sehingga tidak ada API request yang berjalan setelah user logout.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get canManageTasks(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'manager';
  }

  // ─── Kanban getters: group tasks berdasarkan status ──────────────────────

  /** Tasks dengan status 'todo' */
  get todoTasks(): Task[] {
    return this.tasks.filter(t => t.status === 'todo');
  }

  /** Tasks dengan status 'in_progress' */
  get inProgressTasks(): Task[] {
    return this.tasks.filter(t => t.status === 'in_progress');
  }

  /** Tasks dengan status 'done' */
  get doneTasks(): Task[] {
    return this.tasks.filter(t => t.status === 'done');
  }

  // ─── Drag & Drop handlers (HTML5 native API) ─────────────────────────────

  /**
   * Dipanggil saat task mulai di-drag
   * Simpan referensi task yang sedang di-drag ke this.draggedTask
   */
  onDragStart(event: DragEvent, task: Task): void {
    this.draggedTask = task;
    event.dataTransfer!.effectAllowed = 'move';
  }

  /**
   * Dipanggil saat drag memasuki area drop (kolom kanban)
   * Highlight kolom yang sedang di-hover
   */
  onDragOver(event: DragEvent, status: string): void {
    event.preventDefault(); // Wajib untuk mengizinkan drop
    event.dataTransfer!.dropEffect = 'move';
    this.dragOverColumn = status;
  }

  /**
   * Dipanggil saat drag keluar dari area kolom
   */
  onDragLeave(status: string): void {
    if (this.dragOverColumn === status) {
      this.dragOverColumn = null;
    }
  }

  /**
   * Dipanggil saat task di-drop ke kolom
   * Update status task jika berbeda dari status kolom tujuan
   */
  onDrop(event: DragEvent, newStatus: string): void {
    event.preventDefault();
    this.dragOverColumn = null;

    if (!this.draggedTask) return;
    if (this.draggedTask.status === newStatus) {
      this.draggedTask = null;
      return;
    }

    // Optimistic update: ubah status di UI dulu
    const task = this.draggedTask;
    const oldStatus = task.status;
    task.status = newStatus as 'todo' | 'in_progress' | 'done';
    this.draggedTask = null;

    // Kirim update ke API
    this.onStatusChange(task, newStatus, oldStatus);
  }

  /**
   * Dipanggil saat drag selesai (drop atau dibatalkan)
   */
  onDragEnd(): void {
    this.draggedTask = null;
    this.dragOverColumn = null;
  }

  // ─── Status Management ────────────────────────────────────────────────────

  /**
   * Load custom statuses milik project ini dari API.
   * Digunakan untuk mengisi kolom kanban dan dropdown status di form.
   */
  loadStatuses(): void {
    this.isLoadingStatuses = true;
    this.projectStatusService.getStatuses(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoadingStatuses = false;
          if (res.status === 'success') {
            this.projectStatuses = res.data.statuses;
          }
        },
        error: () => { this.isLoadingStatuses = false; }
      });
  }

  /**
   * Helper: ambil tasks berdasarkan slug status (untuk kanban view).
   * Menggantikan todoTasks/inProgressTasks/doneTasks yang hardcoded.
   *
   * @param slug - slug status (misal: 'todo', 'in_progress', 'done', atau custom)
   */
  getTasksByStatus(slug: string): Task[] {
    return this.tasks.filter(t => t.status === slug);
  }

  /**
   * Helper: cari nama tampilan status berdasarkan slug.
   */
  getStatusName(slug: string): string {
    const found = this.projectStatuses.find(s => s.slug === slug);
    return found ? found.name : slug;
  }

  /**
   * Buka modal manage status.
   * Jika status dikirim, mode edit; jika tidak, mode tambah baru.
   *
   * @param status - ProjectStatus untuk mode edit, atau null untuk tambah baru
   */
  openStatusModal(status: ProjectStatus | null = null): void {
    this.editingStatus = status;
    this.statusFormName = status ? status.name : '';
    this.statusFormColor = status ? status.color : 'gray';
    this.showStatusModal = true;
  }

  /**
   * Submit form manage status (create atau update).
   */
  onSaveStatus(): void {
    if (!this.statusFormName.trim()) {
      Swal.fire({ icon: 'warning', text: 'Nama status tidak boleh kosong.', toast: true, position: 'top-end', timer: 2500, showConfirmButton: false });
      return;
    }

    this.isSubmittingStatus = true;
    const payload = { name: this.statusFormName.trim(), color: this.statusFormColor };

    const request$ = this.editingStatus
      ? this.projectStatusService.updateStatus(this.projectId, this.editingStatus.id, payload)
      : this.projectStatusService.createStatus(this.projectId, payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.isSubmittingStatus = false;
        if (res.status === 'success') {
          this.showStatusModal = false;
          Swal.fire({ icon: 'success', text: this.editingStatus ? 'Status diperbarui.' : 'Status ditambahkan.', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
          this.loadStatuses();
        }
      },
      error: (err) => {
        this.isSubmittingStatus = false;
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.error?.message || 'Terjadi kesalahan.', confirmButtonColor: '#6366f1' });
      }
    });
  }

  /**
   * Konfirmasi dan hapus status.
   * Backend akan menolak jika masih ada task di status itu.
   *
   * @param status - Status yang akan dihapus
   */
  async onDeleteStatus(status: ProjectStatus): Promise<void> {
    const result = await Swal.fire({
      title: `Hapus Status "${status.name}"?`,
      html: status.task_count && status.task_count > 0
        ? `<span class="text-danger">Ada <strong>${status.task_count} task</strong> di status ini. Pindahkan dulu sebelum menghapus.</span>`
        : `Status ini akan dihapus permanen dari project.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    this.projectStatusService.deleteStatus(this.projectId, status.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire({ icon: 'success', text: 'Status dihapus.', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
          this.loadStatuses();
          this.loadTasks(); // Refresh tasks jika ada yang terpengaruh
        },
        error: (err) => {
          Swal.fire({ icon: 'error', title: 'Gagal Hapus', text: err.error?.message || 'Terjadi kesalahan.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  // ─── Drag-Drop: Reorder Status List ──────────────────────────────────────

  /**
   * Dipanggil saat drag dimulai pada salah satu item status di modal.
   * Menyimpan snapshot urutan asli sebagai referensi rollback.
   *
   * @param event  - DragEvent bawaan browser
   * @param status - Status yang di-drag
   */
  onStatusDragStart(event: DragEvent, status: ProjectStatus): void {
    this.draggingStatusId = status.id;
    // Simpan snapshot urutan sebelum drag (untuk rollback jika API gagal)
    this._statusOrderBeforeDrag = [...this.projectStatuses];
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(status.id));
    }
  }

  /**
   * Dipanggil saat item yang di-drag melewati item list lain.
   * Melakukan optimistic reorder langsung di UI.
   *
   * @param event  - DragEvent
   * @param target - Status yang sedang di-hover (calon posisi baru)
   */
  onStatusDragOver(event: DragEvent, target: ProjectStatus): void {
    event.preventDefault();
    if (this.draggingStatusId === null || this.draggingStatusId === target.id) return;

    this.dragOverStatusId = target.id;

    // Optimistic update: pindahkan item di array lokal
    const fromIndex = this.projectStatuses.findIndex(s => s.id === this.draggingStatusId);
    const toIndex = this.projectStatuses.findIndex(s => s.id === target.id);

    if (fromIndex === -1 || toIndex === -1) return;

    // Pindahkan elemen tanpa mutasi langsung
    const reordered = [...this.projectStatuses];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    this.projectStatuses = reordered;
  }

  /**
   * Dipanggil saat item di-drop.
   * Memicu persistStatusReorder() untuk simpan urutan baru ke API.
   */
  onStatusDrop(event: DragEvent): void {
    event.preventDefault();
    this.persistStatusReorder();
  }

  /**
   * Dipanggil saat drag selesai (baik berhasil atau dibatalkan).
   * Bersihkan state drag.
   */
  onStatusDragEnd(): void {
    this.draggingStatusId = null;
    this.dragOverStatusId = null;
  }

  /**
   * Simpan urutan status saat ini ke backend via PUT /projects/:id/statuses/reorder.
   * Jika API gagal, rollback ke urutan sebelum drag.
   */
  private persistStatusReorder(): void {
    const order = this.projectStatuses.map(s => s.id);

    this.projectStatusService.reorderStatuses(this.projectId, order)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            // Update dengan data dari server (positions resmi)
            this.projectStatuses = res.data.statuses;
            Swal.fire({
              icon: 'success',
              text: 'Urutan status diperbarui.',
              toast: true,
              position: 'top-end',
              timer: 1500,
              showConfirmButton: false,
            });
          }
        },
        error: (err) => {
          // Rollback ke urutan sebelum drag
          this.projectStatuses = [...this._statusOrderBeforeDrag];
          Swal.fire({ icon: 'error', title: 'Gagal', text: err.error?.message || 'Urutan tidak bisa disimpan.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  /**
   * Load detail project dari API
   */
  loadProject(): void {
    this.projectService.getProject(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoadingProject = false;
          if (res.status === 'success') {
            this.project = res.data.project;
            this.members = res.data.members;
          }
        },
        error: (err) => {
          this.isLoadingProject = false;
          Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Gagal memuat project.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  /**
   * Load semua user aktif dari API — digunakan untuk dropdown "Assign To"
   * Berbeda dari this.members yang hanya berisi member project ini.
   */
  loadAllUsers(): void {
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.allUsers = res.data.users;
          }
        },
        error: () => {
          this.allUsers = this.members;
        }
      });
  }

  loadTasks(): void {
    this.isLoadingTasks = true;
    this.taskService.getTasks(this.projectId, 1, 50, this.taskStatusFilter || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoadingTasks = false;
          if (res.status === 'success') {
            this.tasks = res.data.items;
          }
        },
        error: (err) => {
          this.isLoadingTasks = false;
          Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Gagal memuat tasks.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  /**
   * Ubah status task secara inline (dropdown di table view)
   * atau dipanggil dari drag & drop di kanban view.
   *
   * @param task - Task yang diubah statusnya
   * @param newStatus - Status baru
   * @param oldStatus - Status lama (opsional, untuk rollback jika gagal saat drag-drop)
   */
  onStatusChange(task: Task, newStatus: string, oldStatus?: string): void {
    // Optimistic update: ubah status di UI dulu
    if (!oldStatus) {
      task.status = newStatus;
    }

    // Kirim ke API — gunakan slug apa adanya (support custom status)
    this.taskService.updateTaskStatus(task.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            const statusName = this.getStatusName(newStatus);
            Swal.fire({
              icon: 'success',
              text: `Status diubah ke "${statusName}"`,
              toast: true,
              position: 'top-end',
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadStatuses(); // Refresh task_count di setiap status
          }
        },
        error: (err) => {
          // Rollback status ke status lama jika API gagal
          task.status = oldStatus ?? newStatus;
          Swal.fire({ icon: 'error', title: 'Gagal update status', text: err.error?.message || 'Terjadi kesalahan.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  /**
   * Submit form buat task baru
   */
  onCreateTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isSubmittingTask = true;
    const v = this.taskForm.value;

    // Ambil slug status pertama sebagai default jika form belum diisi
    const defaultStatus = this.projectStatuses.length > 0 ? this.projectStatuses[0].slug : 'todo';

    this.taskService.createTask({
      project_id: this.projectId,
      title: v.title,
      description: v.description || undefined,
      assigned_to: v.assigned_to ? +v.assigned_to : undefined,
      priority: v.priority,
      due_date: v.due_date || undefined,
      status: v.status || defaultStatus,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isSubmittingTask = false;
          if (res.status === 'success') {
            this.showCreateTaskModal = false;
            // Reset form dengan status default dari project statuses
            this.taskForm.reset({ priority: 'medium', status: defaultStatus });
            Swal.fire({ icon: 'success', title: 'Task dibuat!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
            this.loadTasks();
            this.loadStatuses(); // Update task_count di kolom status
          }
        },
        error: (err) => {
          this.isSubmittingTask = false;
          Swal.fire({ icon: 'error', title: 'Gagal membuat task', text: err.error?.message || 'Terjadi kesalahan.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  /**
   * Konfirmasi dan hapus task via SweetAlert2
   */
  async onDeleteTask(task: Task): Promise<void> {
    const result = await Swal.fire({
      title: 'Hapus Task?',
      html: `Hapus task <strong>"${task.title}"</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== task.id);
        Swal.fire({ icon: 'success', text: 'Task dihapus.', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'Gagal hapus task', text: err.error?.message || 'Terjadi kesalahan.', confirmButtonColor: '#6366f1' });
      }
    });
  }

  /**
   * Filter tasks by status dan reload
   */
  applyTaskFilter(): void {
    this.loadTasks();
  }
}
