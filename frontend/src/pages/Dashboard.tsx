
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ListTodo,
  TrendingUp,
  Users,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { useAuth } from '../context/AuthContext';

import {
  getDashboardOverview,
  type DashboardOverview,
} from '../api/dashboard';

import './Dashboard.css';

const metricIcons = [
  Users,
  ListTodo,
  CheckCircle2,
  TrendingUp,
];

export default function Dashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] =
    useState<DashboardOverview | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const data = await getDashboardOverview();

        if (active) {
          setDashboard(data);
        }
      } catch {
        if (active) {
          setError('Unable to load dashboard statistics.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <main className="wp-content">
        <div className="wp-panel" style={{ padding: 40 }}>
          <RefreshCw className="wp-spin" size={24} />
          <p>Loading live dashboard statistics...</p>
        </div>
      </main>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="wp-content">
        <div className="wp-panel" style={{ padding: 40 }}>
          <AlertCircle size={28} color="#dc2626" />

          <h2>Dashboard unavailable</h2>

          <p role="alert">
            {error || 'Dashboard data is unavailable.'}
          </p>

          <button
            type="button"
            className="wp-panel-tag"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const { productivity, recent_tasks: recentTasks } = dashboard;

  const taskStatus = dashboard.task_status;

  const metrics = [
    {
      label: 'Total Employees',
      value: dashboard.metrics.total_employees,
      change: 'Active employees',
    },
    {
      label: 'In Progress',
      value: dashboard.metrics.in_progress_tasks,
      change: 'Currently active tasks',
    },
    {
      label: 'Completed Tasks',
      value: dashboard.metrics.completed_tasks,
      change: 'Completed successfully',
    },
    {
      label: 'Completion Rate',
      value: `${dashboard.metrics.completion_rate}%`,
      change: `${dashboard.metrics.overdue_tasks} overdue tasks`,
    },
  ];

  const hasTaskData = taskStatus.some(
    (item) => item.value > 0
  );

  return (
    <main className="wp-content">

      {/* Dashboard Header */}
      <div className="wp-heading">
        <div>
          <div className="wp-eyebrow">
            ADMIN OVERVIEW
          </div>

          <h1>
            Welcome back,{' '}
            {user?.name?.split(' ')[0] || 'Admin'}{' '}
            <span aria-hidden="true">👋</span>
          </h1>

          <p>
            Here's what's happening across your organization.
          </p>
        </div>

        <button
          type="button"
          className="wp-panel-tag"
          onClick={() => setRefreshKey((key) => key + 1)}
        >
          <RefreshCw size={14} />
          Refresh data
        </button>
      </div>

      {/* Live Statistics */}
      <div className="wp-metrics">
        {metrics.map((metric, index) => {
          const Icon = metricIcons[index] ?? Users;

          return (
            <article className="wp-metric" key={metric.label}>
              <div className="wp-metric-top">
                <span>{metric.label}</span>

                <div
                  className={`wp-metric-icon wp-metric-icon-${index}`}
                >
                  <Icon size={21} />
                </div>
              </div>

              <strong>{metric.value}</strong>
              <small>{metric.change}</small>
            </article>
          );
        })}
      </div>

      {/* Dashboard Charts */}
      <div className="wp-charts">

        {/* Weekly Productivity */}
        <section className="wp-panel wp-productivity">
          <div className="wp-panel-heading">
            <div>
              <h2>Weekly productivity</h2>
              <p>Created vs. completed tasks</p>
            </div>

            <span className="wp-panel-tag">
              Last 7 days
            </span>
          </div>

          <div className="wp-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={productivity}
                margin={{
                  top: 8,
                  right: 8,
                  left: -24,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="wpArea"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#6366f1"
                      stopOpacity={0.24}
                    />

                    <stop
                      offset="95%"
                      stopColor="#6366f1"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#edf0f6"
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#8993a5',
                    fontSize: 12,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tick={{
                    fill: '#8993a5',
                    fontSize: 12,
                  }}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  name="Created"
                  dataKey="assigned"
                  stroke="#a5b4fc"
                  strokeWidth={2}
                  fill="transparent"
                />

                <Area
                  type="monotone"
                  name="Completed"
                  dataKey="completed"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#wpArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="wp-legend">
            <span>
              <i className="wp-dot purple" />
              Completed
            </span>

            <span>
              <i className="wp-dot lavender" />
              Created
            </span>
          </div>
        </section>

        {/* Task Status Distribution */}
        <section className="wp-panel wp-status">
          <div className="wp-panel-heading">
            <div>
              <h2>Task status</h2>
              <p>Live task distribution</p>
            </div>
          </div>

          <div className="wp-pie">
            {hasTaskData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={91}
                    paddingAngle={3}
                  >
                    {taskStatus.map((item) => (
                      <Cell
                        key={item.name}
                        fill={item.color}
                      />
                    ))}
                  </Pie>

                  <Tooltip />

                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={9}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="wp-empty-state">
                No task data available yet.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Recent Tasks */}
      <section className="wp-panel wp-activity">
        <div className="wp-panel-heading">
          <div>
            <h2>Recent tasks</h2>
            <p>Latest task updates from your team</p>
          </div>

          <span className="wp-panel-tag">
            Live activity
          </span>
        </div>

        <div className="wp-activity-list">
          {recentTasks.length === 0 ? (
            <div className="wp-empty-state">
              No recent tasks found.
            </div>
          ) : (
            recentTasks.map((task) => (
              <div
                className="wp-activity-row"
                key={task.id}
              >
                <span className="wp-activity-avatar">
                  {task.assignee
                    .split(' ')
                    .map((name) => name[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>

                <div>
                  <strong>{task.title}</strong>{' '}
                  <span>
                    assigned to {task.assignee}
                  </span>

                  <small>
                    {task.status.replace(/_/g, ' ')}
                    {' · '}
                    {task.updated_at
                      ? new Date(task.updated_at).toLocaleString()
                      : 'Date unavailable'}
                  </small>
                </div>

                <ArrowUpRight
                  size={17}
                  color="#a4adbc"
                />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Footer */}
      <div className="wp-footnote">
        <Clock3 size={14} />
        Live statistics from WorkPulse Laravel API.
      </div>

    </main>
  );
}
