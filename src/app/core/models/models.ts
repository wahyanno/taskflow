/**
 * Interface Models - Representasi data dari API backend
 * Semua interface TypeScript untuk data model TaskFlow
 */

/** Data User */
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  status?: string;
}

/** Data Role */
export interface Role {
  id: number;
  name: 'admin' | 'manager' | 'member';
}

/** Data Project */
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
  task_counts?: {
    todo: number;
    in_progress: number;
    done: number;
  };
}

/** Custom status dalam sebuah project */
export interface ProjectStatus {
  id: number;
  project_id?: number;
  name: string;
  slug: string;
  color: 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | string;
  position: number;
  task_count?: number;
}

/** Data Task */
export interface Task {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  assigned_to?: number;
  assignee_name?: string;
  /** Status task — slug dari project_statuses (misal: 'todo', 'in_progress', 'done', atau custom) */
  status: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_by: number;
  creator_name?: string;
  created_at: string;
  updated_at: string;
}

/** Task Activity Log */
export interface TaskActivityLog {
  id: number;
  task_id: number;
  action: 'status_changed' | 'reassigned' | 'updated';
  old_value?: string;
  new_value?: string;
  changed_by_name: string;
  created_at: string;
}

/** Response format standar dari API */
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
