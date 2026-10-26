
import { useCallback, useEffect, useState } from 'react';
import {
  CalendarCheck,
  Users,
  UserCheck,
  Clock3,
  UserX,
  RefreshCw,
  Search,
} from 'lucide-react';

import api from '../api/axios';
import './Attendance.css';

type AttendanceRecord = {
  id: number;
  employee_id: number;
  attendance_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  worked_minutes: number;
  late_minutes: number;
  status: 'present' | 'late' | 'absent' | 'leave';
  employee?: {
    id: number;
    user?: {
      name: string;
      email: string;
    };
  };
};

type AttendanceResponse = {
  date: string;
  summary: {
    total_employees: number;
    present: number;
    late: number;
    not_checked_in: number;
  };
  records: {
    data: AttendanceRecord[];
    current_page: number;
    last_page: number;
    total: number;
  };
};

const localDate = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const value = (type: string) =>
    parts.find(part => part.type === type)?.value ?? '';

  return `${value('year')}-${value('month')}-${value('day')}`;
};

function formatTime(value: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

function formatMinutes(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function Attendance() {
  const [date, setDate] = useState(localDate);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const loadAttendance = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get<AttendanceResponse>(
        '/api/attendance/admin',
        {
          params: { date, page },
          signal,
        }
      );

      if (!signal.aborted) {
        setData(response.data);
      }
    } catch {
      if (!signal.aborted) {
        setError('Unable to load attendance records.');
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [date, page]);

  useEffect(() => {
    const controller = new AbortController();

    void loadAttendance(controller.signal);

    return () => controller.abort();
  }, [loadAttendance, refreshKey]);

  const summary = data?.summary;

  const stats = [
    {
      label: 'Total Employees',
      value: summary?.total_employees ?? 0,
      icon: Users,
      color: 'purple',
    },
    {
      label: 'Present',
      value: summary?.present ?? 0,
      icon: UserCheck,
      color: 'green',
    },
    {
      label: 'Late Arrivals',
      value: summary?.late ?? 0,
      icon: Clock3,
      color: 'orange',
    },
    {
      label: 'Not Checked In',
      value: summary?.not_checked_in ?? 0,
      icon: UserX,
      color: 'red',
    },
  ];

  const records = data?.records.data ?? [];

  const filteredRecords = records.filter(record => {
    const name = record.employee?.user?.name ?? '';
    const email = record.employee?.user?.email ?? '';

    return `${name} ${email}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  return (
    <main className="wp-content attendance-page">
      <div className="attendance-heading">
        <div>
          <div className="wp-eyebrow">
            WORKSPACE / ATTENDANCE
          </div>

          <h1>Attendance Management</h1>

          <p>
            Track employee attendance, check-ins,
            working hours and daily records.
          </p>
        </div>

        <button
          className="attendance-refresh"
          onClick={() => setRefreshKey(value => value + 1)}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="attendance-stats">
        {stats.map(stat => {
          const Icon = stat.icon;

          return (
            <article className="attendance-stat" key={stat.label}>
              <div className={`attendance-stat-icon ${stat.color}`}>
                <Icon size={22} />
              </div>

              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          );
        })}
      </div>

      <section className="attendance-panel">
        <div className="attendance-panel-header">
          <div>
            <h2>Daily Attendance</h2>
            <p>View attendance records by date.</p>
          </div>

          <label className="attendance-date">
            <CalendarCheck size={18} />
            <input
              type="date"
              value={date}
              onChange={event => {
                setDate(event.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>

        <div className="attendance-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search employee name or email..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>

        {error && (
          <div className="attendance-error" role="alert">
            {error}
          </div>
        )}

        <div className="attendance-table-wrap">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Worked Hours</th>
                <th>Late</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="attendance-empty">
                    Loading attendance records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="attendance-empty">
                    No attendance records found for this selection.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => (
                  <tr key={record.id}>
                    <td>
                      <strong>
                        {record.employee?.user?.name ?? 'Unknown'}
                      </strong>
                      <small>
                        {record.employee?.user?.email ?? ''}
                      </small>
                    </td>

                    <td>{record.attendance_date.slice(0, 10)}</td>
                    <td>{formatTime(record.check_in_at)}</td>
                    <td>{formatTime(record.check_out_at)}</td>
                    <td>{formatMinutes(record.worked_minutes)}</td>
                    <td>{record.late_minutes} min</td>

                    <td>
                      <span className={`attendance-badge ${record.status}`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="attendance-pagination">
          <span>
            Total records: {data?.records.total ?? 0}
          </span>

          <div>
            <button
              disabled={loading || page <= 1}
              onClick={() => setPage(value => value - 1)}
            >
              Previous
            </button>

            <span>
              Page {page} of {data?.records.last_page ?? 1}
            </span>

            <button
              disabled={
                loading ||
                page >= (data?.records.last_page ?? 1)
              }
              onClick={() => setPage(value => value + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
