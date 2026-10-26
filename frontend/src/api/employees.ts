
import api from './axios';

export type EmployeeRole = 'employee' | 'manager';

export interface Employee {
  id: number;
  user_id: number;
  employee_code: string;
  department: string;
  designation: string;
  joining_date: string;
  manager_id: number | null;
  user: {
    id: number;
    name: string;
    email: string;
    role: EmployeeRole;
    is_active: boolean;
  };
  manager: {
    id: number;
    name: string;
  } | null;
}

export interface EmployeePayload {
  name: string;
  email: string;
  password?: string;
  role: EmployeeRole;
  employee_code: string;
  department: string;
  designation: string;
  joining_date: string;
  manager_id: number | null;
}

export interface EmployeePage {
  data: Employee[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  role?: string;
  status?: string;
  page?: number;
}

export async function getEmployees(filters: EmployeeFilters = {}) {
  const response = await api.get<EmployeePage>('/api/employees', {
    params: filters,
  });
  return response.data;
}

export async function createEmployee(payload: EmployeePayload) {
  const response = await api.post('/api/employees', payload);
  return response.data;
}

export async function updateEmployee(
  id: number,
  payload: Omit<EmployeePayload, 'password'>
) {
  const response = await api.put(`/api/employees/${id}`, payload);
  return response.data;
}

export async function toggleEmployeeStatus(id: number) {
  const response = await api.patch(`/api/employees/${id}/status`);
  return response.data;
}
