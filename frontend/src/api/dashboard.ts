
import api from './axios';

export interface DashboardMetrics {
  total_employees: number;
  total_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
}

export interface ProductivityPoint {
  day: string;
  assigned: number;
  completed: number;
}

export interface TaskStatusPoint {
  name: string;
  value: number;
  color: string;
}

export interface RecentTask {
  id: number;
  title: string;
  status: string;
  assignee: string;
  updated_at: string | null;
}

export interface DashboardOverview {
  metrics: DashboardMetrics;
  productivity: ProductivityPoint[];
  task_status: TaskStatusPoint[];
  recent_tasks: RecentTask[];
}

export async function getDashboardOverview() {
  const response = await api.get<DashboardOverview>(
    '/api/dashboard/overview'
  );

  return response.data;
}
