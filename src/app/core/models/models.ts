/**
 * Data Models — TypeScript interfaces for all TaskFlow API responses.
 * Updated v2: soft delete fields, is_overdue flag, ProjectActivityLog
 */

/** Authenticated user data */
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  status?: string;
}

/** Role definition */
export interface Role {
  id: number;
  name: 'admin' | 'manager' | 'member';
}

/** Project data */
export interface Project {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'completed';
  deadline?: string;
  created_by: number;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  /** Soft delete fields — for internal use, not shown in UI */
  is_deleted?: boolean;
  deleted_at?: string | null;
  task_counts?: {
    todo: number;
    in_progress: number;
    done: number;
  };
}

/** Custom status for a project (from project_statuses table) */
export interface ProjectStatus {
  id: number;
  project_id?: number;
  name: string;
  slug: string;
  color: 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | string;
  position: number;
  task_count?: number;
}

/** Task data */
export interface Task {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  assigned_to?: number;
  assignee_name?: string;
  /** Status slug from project_statuses (e.g. 'todo', 'in_progress', 'done', or custom) */
  status: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_by: number;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  /**
   * Overdue flag returned by the server (Business Rule):
   * TRUE when status != 'done' AND due_date < today
   */
  is_overdue?: boolean;
  /** Soft delete fields */
  is_deleted?: boolean;
  deleted_at?: string | null;
}

/** Task activity log entry */
export interface TaskActivityLog {
  id: number;
  task_id: number;
  action: 'status_changed' | 'reassigned' | 'updated';
  old_value?: string;
  new_value?: string;
  changed_by_name: string;
  created_at: string;
}

/**
 * Project activity log entry — enterprise-grade audit trail for project changes.
 * Actions: project_created, project_updated, deadline_changed,
 *          project_status_changed, member_added, member_removed, project_deleted
 */
export interface ProjectActivityLog {
  id: number;
  project_id: number;
  action: string;
  old_value?: string;
  new_value?: string;
  changed_by_name: string;
  created_at: string;
}

/** Standard API response envelope */
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/** Auth login response data */
export interface AuthResponse {
  token: string;
  user: User;
}

/** Dashboard summary data */
export interface DashboardData {
  total_projects: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_percent: number;
  task_by_status: {
    todo: number;
    in_progress: number;
    done: number;
  };
  recent_projects: Project[];
}
