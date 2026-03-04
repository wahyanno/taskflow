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
 * ProjectDetailComponent — Project detail view with task management.
 *
 * Features:
 * - Display project info (name, deadline, members)
 * - Task list with status filter
 * - Modal form for creating a new task
 * - Inline status update via dropdown
 * - Delete task with SweetAlert2 confirmation
 * - Priority and status badges
 * - Kanban board with drag & drop (CDK / HTML5)
 * - Custom status drag-drop reordering
 */
@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  projectId!: number;
  project: Project | null = null;
  /** Members of this project (shown in the header) */
  members: User[] = [];
  /** All active users in the system (used in the Assign To dropdown) */
  allUsers: User[] = [];
  tasks: Task[] = [];
  isLoadingProject = true;
  isLoadingTasks = true;

  /** Custom statuses for this project */
  projectStatuses: ProjectStatus[] = [];
  isLoadingStatuses = false;

  /**
   * Subject emitted when the component is destroyed.
   * All subscriptions using takeUntil(this.destroy$) are automatically cancelled.
   */
  private destroy$ = new Subject<void>();

  /** Show/hide create task modal */
  showCreateTaskModal = false;
  isSubmittingTask = false;

  /** Task status filter (table view only) */
  taskStatusFilter = '';

  /** View mode: 'table' or 'kanban' */
  viewMode: 'table' | 'kanban' = 'table';

  /** The task currently being dragged (kanban drag & drop) */
  draggedTask: Task | null = null;

  /** The column being hovered during a drag (for highlight) */
  dragOverColumn: string | null = null;

  // ─── State: Manage Status Modal ────────────────────────────────────────────
  showStatusModal = false;
  /** Status being edited (null = add new mode) */
  editingStatus: ProjectStatus | null = null;
  statusFormName = '';
  statusFormColor = 'gray';
  isSubmittingStatus = false;

  // ─── State: Drag-Drop Reorder Status List ───────────────────────────────────
  /** Status item currently being dragged in the modal list */
  draggingStatusId: number | null = null;
  /** Status item currently hovered during drag (drop target) */
  dragOverStatusId: number | null = null;
  /** Snapshot of the original order before drag — used for rollback */
  private _statusOrderBeforeDrag: ProjectStatus[] = [];

  /** Task creation form */
  taskForm: FormGroup;

  /** Currently authenticated user */
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
      status: ['todo'], // default slug 'todo', updated after statuses are loaded
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
   * Lifecycle hook: called when the component is destroyed (navigation / logout).
   * Emits destroy$ to automatically cancel all active subscriptions.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get canManageTasks(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'manager';
  }

  // ─── Kanban getters: group tasks by status ───────────────────────────────

  /** Tasks with status 'todo' */
  get todoTasks(): Task[] {
    return this.tasks.filter(t => t.status === 'todo');
  }

  /** Tasks with status 'in_progress' */
  get inProgressTasks(): Task[] {
    return this.tasks.filter(t => t.status === 'in_progress');
  }

  /** Tasks with status 'done' */
  get doneTasks(): Task[] {
    return this.tasks.filter(t => t.status === 'done');
  }

  // ─── Drag & Drop handlers (HTML5 native API) ──────────────────────────────

  /**
   * Called when a task drag starts.
   * Saves a reference to the dragged task.
   */
  onDragStart(event: DragEvent, task: Task): void {
    this.draggedTask = task;
    event.dataTransfer!.effectAllowed = 'move';
  }

  /**
   * Called when a dragged item enters a drop zone (kanban column).
   * Highlights the column being hovered.
   */
  onDragOver(event: DragEvent, status: string): void {
    event.preventDefault(); // Required to allow the drop
    event.dataTransfer!.dropEffect = 'move';
    this.dragOverColumn = status;
  }

  /**
   * Called when a dragged item leaves a column area.
   */
  onDragLeave(status: string): void {
    if (this.dragOverColumn === status) {
      this.dragOverColumn = null;
    }
  }

  /**
   * Called when a task is dropped onto a column.
   * Updates the task's status if it differs from the target column.
   */
  onDrop(event: DragEvent, newStatus: string): void {
    event.preventDefault();
    this.dragOverColumn = null;

    if (!this.draggedTask) return;
    if (this.draggedTask.status === newStatus) {
      this.draggedTask = null;
      return;
    }

    // Optimistic update: change UI status immediately
    const task = this.draggedTask;
    const oldStatus = task.status;
    task.status = newStatus as 'todo' | 'in_progress' | 'done';
    this.draggedTask = null;

    // Persist to API
    this.onStatusChange(task, newStatus, oldStatus);
  }

  /**
   * Called when a drag ends (dropped or cancelled).
   */
  onDragEnd(): void {
    this.draggedTask = null;
    this.dragOverColumn = null;
  }

  // ─── Status Management ────────────────────────────────────────────────────

  /**
   * Load custom statuses for this project from the API.
   * Used to populate kanban columns and the status dropdown in the task form.
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
   * Helper: return tasks matching a given status slug (for kanban view).
   * Replaces the hardcoded todoTasks / inProgressTasks / doneTasks getters.
   *
   * @param slug - Status slug (e.g. 'todo', 'in_progress', 'done', or custom)
   */
  getTasksByStatus(slug: string): Task[] {
    return this.tasks.filter(t => t.status === slug);
  }

  /**
   * Helper: resolve a status display name from its slug.
   */
  getStatusName(slug: string): string {
    const found = this.projectStatuses.find(s => s.slug === slug);
    return found ? found.name : slug;
  }

  /**
   * Open the manage-status modal.
   * If a status is passed, enter edit mode; otherwise enter add-new mode.
   *
   * @param status - ProjectStatus to edit, or null to add a new one
   */
  openStatusModal(status: ProjectStatus | null = null): void {
    this.editingStatus = status;
    this.statusFormName = status ? status.name : '';
    this.statusFormColor = status ? status.color : 'gray';
    this.showStatusModal = true;
  }

  /**
   * Submit the manage-status form (create or update).
   */
  onSaveStatus(): void {
    if (!this.statusFormName.trim()) {
      Swal.fire({ icon: 'warning', text: 'Status name cannot be empty.', toast: true, position: 'top-end', timer: 2500, showConfirmButton: false });
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
          Swal.fire({ icon: 'success', text: this.editingStatus ? 'Status updated.' : 'Status added.', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
          this.loadStatuses();
        }
      },
      error: (err) => {
        this.isSubmittingStatus = false;
        Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'An error occurred.', confirmButtonColor: '#6366f1' });
      }
    });
  }

  /**
   * Show confirmation dialog, then delete the status.
   * The backend will reject the request if tasks still exist under this status.
   *
   * @param status - The status to delete
   */
  async onDeleteStatus(status: ProjectStatus): Promise<void> {
    const result = await Swal.fire({
      title: `Delete Status "${status.name}"?`,
      html: status.task_count && status.task_count > 0
        ? `<span class="text-danger">There are <strong>${status.task_count} task(s)</strong> assigned to this status. Move them before deleting.</span>`
        : `This status will be permanently removed from the project.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    this.projectStatusService.deleteStatus(this.projectId, status.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire({ icon: 'success', text: 'Status deleted.', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
          this.loadStatuses();
          this.loadTasks(); // Refresh tasks in case any were affected
        },
        error: (err) => {
          Swal.fire({ icon: 'error', title: 'Delete Failed', text: err.error?.message || 'An error occurred.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  // ─── Drag-Drop: Reorder Status List ──────────────────────────────────────

  /**
   * Called when a status item drag starts in the modal list.
   * Saves a snapshot of the original order for rollback.
   *
   * @param event  - DragEvent from the browser
   * @param status - Status being dragged
   */
  onStatusDragStart(event: DragEvent, status: ProjectStatus): void {
    this.draggingStatusId = status.id;
    // Save a snapshot before dragging (used for rollback if the API fails)
    this._statusOrderBeforeDrag = [...this.projectStatuses];
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(status.id));
    }
  }

  /**
   * Called when the dragged item passes over another list item.
   * Performs an optimistic reorder in the local array.
   *
   * @param event  - DragEvent
   * @param target - Status currently being hovered (potential new position)
   */
  onStatusDragOver(event: DragEvent, target: ProjectStatus): void {
    event.preventDefault();
    if (this.draggingStatusId === null || this.draggingStatusId === target.id) return;

    this.dragOverStatusId = target.id;

    // Optimistic update: move item in the local array
    const fromIndex = this.projectStatuses.findIndex(s => s.id === this.draggingStatusId);
    const toIndex = this.projectStatuses.findIndex(s => s.id === target.id);

    if (fromIndex === -1 || toIndex === -1) return;

    // Move element without mutating directly
    const reordered = [...this.projectStatuses];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    this.projectStatuses = reordered;
  }

  /**
   * Called when a status is dropped.
   * Triggers persistStatusReorder() to save the new order via the API.
   */
  onStatusDrop(event: DragEvent): void {
    event.preventDefault();
    this.persistStatusReorder();
  }

  /**
   * Called when the drag ends (dropped or cancelled).
   * Clears drag state.
   */
  onStatusDragEnd(): void {
    this.draggingStatusId = null;
    this.dragOverStatusId = null;
  }

  /**
   * Persist the current status order to the backend.
   * Rollback to the pre-drag order if the API call fails.
   */
  private persistStatusReorder(): void {
    const order = this.projectStatuses.map(s => s.id);

    this.projectStatusService.reorderStatuses(this.projectId, order)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            // Update with server-confirmed positions
            this.projectStatuses = res.data.statuses;
            Swal.fire({
              icon: 'success',
              text: 'Status order updated.',
              toast: true,
              position: 'top-end',
              timer: 1500,
              showConfirmButton: false,
            });
          }
        },
        error: (err) => {
          // Rollback to the order before drag
          this.projectStatuses = [...this._statusOrderBeforeDrag];
          Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to save order.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  /**
   * Load project details from the API.
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
          Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to load project.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  /**
   * Load all active users from the API — used to populate the "Assign To" dropdown.
   * Distinct from this.members which only contains project members.
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
          Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to load tasks.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  /**
   * Update a task's status — called from the inline dropdown (table view)
   * or from drag & drop (kanban view).
   *
   * @param task      - Task whose status is being changed
   * @param newStatus - New status slug
   * @param oldStatus - Previous status (optional, used for rollback on drag-drop failure)
   */
  onStatusChange(task: Task, newStatus: string, oldStatus?: string): void {
    // Optimistic update: change UI immediately
    if (!oldStatus) {
      task.status = newStatus;
    }

    // Call API — pass slug as-is (supports custom statuses)
    this.taskService.updateTaskStatus(task.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            const statusName = this.getStatusName(newStatus);
            Swal.fire({
              icon: 'success',
              text: `Status changed to "${statusName}"`,
              toast: true,
              position: 'top-end',
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadStatuses(); // Refresh task_count per status column
          }
        },
        error: (err) => {
          // Rollback to the original status if the API call failed
          task.status = oldStatus ?? newStatus;
          Swal.fire({ icon: 'error', title: 'Failed to update status', text: err.error?.message || 'An error occurred.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  /**
   * Submit the create-task form.
   */
  onCreateTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isSubmittingTask = true;
    const v = this.taskForm.value;

    // Use first project status slug as default if the form field is empty
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
            // Reset form keeping the default status from project statuses
            this.taskForm.reset({ priority: 'medium', status: defaultStatus });
            Swal.fire({ icon: 'success', title: 'Task created!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
            this.loadTasks();
            this.loadStatuses(); // Update task_count per status column
          }
        },
        error: (err) => {
          this.isSubmittingTask = false;
          Swal.fire({ icon: 'error', title: 'Failed to create task', text: err.error?.message || 'An error occurred.', confirmButtonColor: '#6366f1' });
        }
      });
  }

  /**
   * Show a SweetAlert2 confirmation dialog, then soft-delete the task.
   */
  async onDeleteTask(task: Task): Promise<void> {
    const result = await Swal.fire({
      title: 'Delete Task?',
      html: `Delete task <strong>"${task.title}"</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== task.id);
        Swal.fire({ icon: 'success', text: 'Task deleted.', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'Failed to delete task', text: err.error?.message || 'An error occurred.', confirmButtonColor: '#6366f1' });
      }
    });
  }

  /**
   * Apply the task status filter and reload the task list.
   */
  applyTaskFilter(): void {
    this.loadTasks();
  }
}
