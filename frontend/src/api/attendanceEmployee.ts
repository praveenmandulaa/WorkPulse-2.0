
import api from './axios';

export type AttendanceRecord = {
  id: number;
  date?: string;
  attendance_date?: string;
  check_in?: string | null;
  check_out?: string | null;
  check_in_at?: string | null;
  check_out_at?: string | null;
  worked_hours?: number | string | null;
  status?: string;
  is_late?: boolean;
};

export type PaginatedAttendance = {
  data: AttendanceRecord[];
  current_page: number;
  last_page: number;
  total: number;
};

export async function getTodayAttendance() {
  const response = await api.get('/api/attendance/today');
  return response.data;
}

export async function checkIn() {
  const response = await api.post('/api/attendance/check-in');
  return response.data;
}

export async function checkOut() {
  const response = await api.post('/api/attendance/check-out');
  return response.data;
}

export async function getAttendanceHistory() {
  const response = await api.get('/api/attendance/history');
  return response.data;
}
