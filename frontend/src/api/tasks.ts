
import api from './axios';

export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'completed'
  | 'blocked';

export type TaskPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export interface TaskUser {
  id: number;
  name: string;
  email?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  assigned_to: number;
  created_by: number;
  assignee?: TaskUser;
  creator?: TaskUser;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface TaskPayload {
  title: string;
  description: string;
  assigned_to: number;
  priority: TaskPriority;
  start_date: string | null;
  due_date: string | null;
}

export interface PaginatedTasks {
  data: Task[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface TaskFilters {
  page?: number;
  search?: string;
  status?: string;
  priority?: string;
}

export async function getTasks(filters: TaskFilters = {}) {
  const response = await api.get<PaginatedTasks>(
    '/api/tasks',
    { params: filters }
  );
  return response.data;
}

export async function createTask(payload: TaskPayload) {
  const response = await api.post('/api/tasks', payload);
  return response.data;
}

export async function updateTask(id: number, payload: TaskPayload) {
  const response = await api.put(`/api/tasks/${id}`, payload);
  return response.data;
}

export async function updateTaskStatus(
  id: number,
  status: TaskStatus,
  progress: number
) {
  const response = await api.patch(`/api/tasks/${id}/status`, {
    status,
    progress,
  });
  return response.data;
}

export async function archiveTask(id: number) {
  const response = await api.delete(`/api/tasks/${id}`);
  return response.data;
}
