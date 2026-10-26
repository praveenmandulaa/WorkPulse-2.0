import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MyTasks from '../components/MyTasks';
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  RefreshCw,
  Star,
  Users,
} from 'lucide-react';
import './ManagerDashboard.css';

type Metrics = {
  team_members: number;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  present_today: number;
  late_today: number;
  not_checked_in: number;
  total_reviews: number;
  finalized_reviews: number;
};

type TeamMember = {
  id: number;
  name: string;
  email: string;
  department: string | null;
  designation: string | null;
  is_present: boolean;
  total_tasks: number;
  completed_tasks: number;
};

type DashboardData = {
  metrics: Metrics;
  team: TeamMember[];
};

type DashboardResponse = {
  message: string;
  data: DashboardData;
};



export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(
  `${import.meta.env.VITE_API_URL}/api/manager/dashboard`,
  {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  }
);

      const result: DashboardResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      setDashboard(result.data);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load manager dashboard.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const metrics = dashboard?.metrics;

  const completionRate = metrics && metrics.total_tasks > 0
    ? Math.round((metrics.completed_tasks / metrics.total_tasks) * 100)
    : 0;

  const attendanceRate = metrics && metrics.team_members > 0
    ? Math.round((metrics.present_today / metrics.team_members) * 100)
    : 0;

  const reviewRate = metrics && metrics.total_reviews > 0
    ? Math.round((metrics.finalized_reviews / metrics.total_reviews) * 100)
    : 0;

  const cards = [
    {
      label: 'Team Members',
      value: metrics?.team_members ?? 0,
      icon: Users,
      color: 'purple',
      detail: 'Assigned employees',
    },
    {
      label: 'Team Tasks',
      value: metrics?.total_tasks ?? 0,
      icon: ClipboardList,
      color: 'blue',
      detail: `${metrics?.completed_tasks ?? 0} completed`,
    },
    {
      label: 'Present Today',
      value: metrics?.present_today ?? 0,
      icon: CalendarCheck,
      color: 'green',
      detail: `${attendanceRate}% team attendance`,
    },
    {
      label: 'Finalized Reviews',
      value: metrics?.finalized_reviews ?? 0,
      icon: Star,
      color: 'orange',
      detail: `${metrics?.total_reviews ?? 0} total reviews`,
    },
  ];

  return (
    <div className="mgr-dashboard">
      <div className="mgr-main">
        <header className="mgr-topbar">
          <div>
            <span className="mgr-eyebrow">MANAGER DASHBOARD</span>
            <h1>Team Overview</h1>
            <p>Monitor team performance, attendance, and progress.</p>
          </div>

          <button
            type="button"
            className="mgr-refresh"
            onClick={() => void loadDashboard(true)}
            disabled={refreshing}
          >
            <RefreshCw size={17} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </header>

        {error && (
          <div className="mgr-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mgr-loading">Loading team dashboard...</div>
        ) : dashboard ? (
          <>
            <section className="mgr-stats">
              {cards.map(card => {
                const Icon = card.icon;

                return (
                  <article className="mgr-stat" key={card.label}>
                    <div className="mgr-stat-top">
                      <span>{card.label}</span>
                      <span className={`mgr-stat-icon ${card.color}`}>
                        <Icon size={20} />
                      </span>
                    </div>
                    <strong>{card.value}</strong>
                    <small>{card.detail}</small>
                  </article>
                );
              })}
            </section>

            <section className="mgr-overview-grid">
              <article className="mgr-panel" id="tasks">
                <div className="mgr-panel-header">
                  <div>
                    <h2>Task Progress</h2>
                    <p>Completion overview for your team</p>
                  </div>
                  <ClipboardList size={21} />
                </div>

                <div className="mgr-progress-header">
                  <strong>{completionRate}%</strong>
                  <span>Completion rate</span>
                </div>

                <div className="mgr-progress-track">
                  <div
                    className="mgr-progress-fill"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>

                <div className="mgr-mini-stats">
                  <div>
                    <CheckCircle2 size={18} />
                    <span>Completed</span>
                    <strong>{metrics?.completed_tasks ?? 0}</strong>
                  </div>
                  <div>
                    <Clock3 size={18} />
                    <span>In Progress</span>
                    <strong>{metrics?.in_progress_tasks ?? 0}</strong>
                  </div>
                  <div>
                    <Activity size={18} />
                    <span>Overdue</span>
                    <strong>{metrics?.overdue_tasks ?? 0}</strong>
                  </div>
                </div>
              </article>

              <article className="mgr-panel" id="attendance">
                <div className="mgr-panel-header">
                  <div>
                    <h2>Today's Attendance</h2>
                    <p>Attendance across assigned employees</p>
                  </div>
                  <CalendarCheck size={21} />
                </div>

                <div className="mgr-progress-header">
                  <strong>{attendanceRate}%</strong>
                  <span>Present today</span>
                </div>

                <div className="mgr-progress-track">
                  <div
                    className="mgr-progress-fill green"
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>

                <div className="mgr-mini-stats">
                  <div>
                    <CheckCircle2 size={18} />
                    <span>Present</span>
                    <strong>{metrics?.present_today ?? 0}</strong>
                  </div>
                  <div>
                    <Clock3 size={18} />
                    <span>Late</span>
                    <strong>{metrics?.late_today ?? 0}</strong>
                  </div>
                  <div>
                    <Users size={18} />
                    <span>Not Checked In</span>
                    <strong>{metrics?.not_checked_in ?? 0}</strong>
                  </div>
                </div>
             </article>
</section>

{/* Manager's personally assigned tasks */}
<section style={{ marginBottom: '24px' }}>
  <MyTasks />
</section>

<section className="mgr-panel mgr-team-panel" id="team">
              <div className="mgr-panel-header">
                <div>
                  <h2>My Team</h2>
                  <p>Employees assigned to your management</p>
                </div>
                <Users size={21} />
              </div>

              <div className="mgr-table-wrap">
                <table className="mgr-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Tasks</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.team.map(member => (
                      <tr key={member.id}>
                        <td>
                          <div className="mgr-person">
                            <span className="mgr-avatar">
                              {member.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                            <div>
                              <strong>{member.name}</strong>
                              <small>{member.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{member.department || 'â€”'}</td>
                        <td>{member.designation || 'â€”'}</td>
                        <td>
                          {member.completed_tasks}/{member.total_tasks}
                        </td>
                        <td>
                          <span
                            className={
                              member.is_present
                                ? 'mgr-status present'
                                : 'mgr-status absent'
                            }
                          >
                            {member.is_present
                              ? 'Present'
                              : 'Not Checked In'}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {dashboard.team.length === 0 && (
                      <tr>
                        <td colSpan={5} className="mgr-empty">
                          No employees are assigned to your team.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mgr-panel mgr-reviews-panel">
              <div>
                <h2>Performance Reviews</h2>
                <p>
                  {metrics?.finalized_reviews ?? 0} of{' '}
                  {metrics?.total_reviews ?? 0} reviews finalized
                </p>
                <div className="mgr-progress-track">
                  <div
                    className="mgr-progress-fill"
                    style={{ width: `${reviewRate}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="mgr-primary"
                onClick={() => navigate('/manager/performance')}
              >
                Manage Reviews
                <ArrowRight size={17} />
              </button>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
