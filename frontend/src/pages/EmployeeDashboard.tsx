import { useCallback, useEffect, useState } from 'react';
import MyTasks from '../components/MyTasks';

import axios from 'axios';
import {
  Activity,
  CalendarDays,
  Clock3,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import {
  getTodayAttendance,
  getAttendanceHistory,
  checkIn,
  checkOut,
  type AttendanceRecord,
} from '../api/attendanceEmployee';

import './EmployeeDashboard.css';

function extractRecord(data: unknown): AttendanceRecord | null {
  if (!data || typeof data !== 'object') return null;

  const value = data as Record<string, unknown>;

  if ('check_in' in value || 'check_in_at' in value) {
    return value as AttendanceRecord;
  }

  if ('attendance' in value) {
    return extractRecord(value.attendance);
  }

  if ('data' in value) {
    return extractRecord(value.data);
  }

  return null;
}

function extractHistory(data: unknown): AttendanceRecord[] {
  if (Array.isArray(data)) return data;

  if (!data || typeof data !== 'object') return [];

  const value = data as Record<string, unknown>;

  if ('data' in value) return extractHistory(value.data);
  if ('attendances' in value) return extractHistory(value.attendances);

  return [];
}

function formatTime(value?: string | null) {
  if (!value) return '--:--';

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return value;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ||
      'Request failed. Please try again.';
  }

  return 'Unexpected error. Please try again.';
}

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [todayResponse, historyResponse] = await Promise.all([
        getTodayAttendance(),
        getAttendanceHistory(),
      ]);

      setToday(extractRecord(todayResponse));
      setHistory(extractHistory(historyResponse));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  const checkedIn = Boolean(
    today?.check_in_at || today?.check_in
  );

  const checkedOut = Boolean(
    today?.check_out_at || today?.check_out
  );

  async function handleCheckIn() {
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      await checkIn();
      await loadAttendance();
      setMessage('Checked in successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  }

  async function handleCheckOut() {
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      await checkOut();
      await loadAttendance();
      setMessage('Checked out successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="employee-dashboard">
      <header className="ed-header">
        <div className="ed-brand">
          <Activity size={26} />
          <strong>WorkPulse <span>2.0</span></strong>
        </div>

        <div className="ed-header-actions">
          <span>{user?.name}</span>
          <button onClick={() => void handleLogout()}>
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </header>

      <main className="ed-container">
        <div className="ed-heading">
          <div>
            <span className="ed-eyebrow">EMPLOYEE WORKSPACE</span>
            <h1>
              Welcome back, {user?.name?.split(' ')[0] || 'Employee'} 👋
            </h1>
            <p>Track your daily attendance and working hours.</p>
          </div>

          <button
            className="ed-refresh"
            disabled={loading || processing}
            onClick={() => void loadAttendance()}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {message && (
          <div className="ed-success" role="status">{message}</div>
        )}

        {error && (
          <div className="ed-error" role="alert">{error}</div>
        )}

        <section className="ed-stats">
          <article className="ed-card">
            <Clock3 size={25} color="#6366f1" />
            <p>Today's Status</p>
            <h2>
              {loading ? 'Loading...' :
                checkedOut ? 'Checked Out' :
                checkedIn ? 'Checked In' : 'Not Checked In'}
            </h2>
          </article>

          <article className="ed-card">
            <LogIn size={25} color="#16a34a" />
            <p>Check In</p>
            <h2>
              {formatTime(today?.check_in_at || today?.check_in)}
            </h2>
          </article>

          <article className="ed-card">
            <LogOut size={25} color="#f59e0b" />
            <p>Check Out</p>
            <h2>
              {formatTime(today?.check_out_at || today?.check_out)}
            </h2>
          </article>
        </section>

        <section className="ed-panel">
          <h2>Daily Attendance</h2>
          <p>Record your attendance for today.</p>

          <div className="ed-buttons">
            <button
              className="ed-checkin"
              disabled={loading || processing || checkedIn}
              onClick={() => void handleCheckIn()}
            >
              <LogIn size={19} />
              {processing ? 'Processing...' : 'Check In'}
            </button>

            <button
              className="ed-checkout"
              disabled={loading || processing || !checkedIn || checkedOut}
              onClick={() => void handleCheckOut()}
            >
              <LogOut size={19} />
              Check Out
            </button>
          </div>
        </section>
          {/* Employee assigned tasks */}
          <section style={{ marginBottom: '24px' }}>
            <MyTasks />
          </section>

          <section className="ed-panel">
            <div className="ed-section-title">
              <CalendarDays size={22} />
              <h2>Attendance History</h2>
            </div>

          <div className="ed-table-wrap">
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Worked Hours</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="ed-empty">
                      {loading
                        ? 'Loading records...'
                        : 'No attendance records available.'}
                    </td>
                  </tr>
                ) : (
                  history.map((record) => (
                    <tr key={record.id}>
                      <td>
                        {record.attendance_date || record.date || '-'}
                      </td>
                      <td>
                        {formatTime(record.check_in_at || record.check_in)}
                      </td>
                      <td>
                        {formatTime(record.check_out_at || record.check_out)}
                      </td>
                      <td>{record.worked_hours ?? '-'}</td>
                      <td>{record.status || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="ed-footer">
          <ShieldCheck size={16} />
          Attendance records are managed by WorkPulse.
        </footer>
      </main>
    </div>
  );
}
