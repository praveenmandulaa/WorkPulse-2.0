import api from '../api/axios';
import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  Users,
} from 'lucide-react';
import './AdminPerformance.css';

type Summary = {
  total_employees: number;
  employees_scored: number;
  average_score: number | null;
  total_tasks: number;
  completed_tasks: number;
  task_completion_rate: number | null;
  finalized_reviews: number;
};

type EmployeeScore = {
  employee_id: number;
  name: string;
  email: string | null;
  department: string | null;
  designation: string | null;
  task_total: number;
  task_completed: number;
  task_completion_score: number | null;
  on_time_score: number | null;
  manager_score: number | null;
  overall_score: number | null;
  available_weight: number;
  is_partial: boolean;
  review_status: string;
};

type DepartmentScore = {
  department: string;
  employees: number;
  average_score: number | null;
};

type AnalyticsData = {
  month: string;
  summary: Summary;
  employees: EmployeeScore[];
  departments: DepartmentScore[];
  note: string;
};

type ApiResponse = {
  message: string;
  data: AnalyticsData;
};


const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}`;
};

function formatScore(value: number | null): string {
  return value === null ? 'N/A' : `${value.toFixed(2)}%`;
}

export default function AdminPerformance() {
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
const response = await api.get<ApiResponse>(
  '/api/admin/performance',
  {
    params: { month },
  }
);

const result = response.data;

      setData(result.data);
    } catch (err) {
      setData(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load analytics.'
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const summary = data?.summary;

  const cards = [
    {
      label: 'Total Employees',
      value: summary?.total_employees ?? 0,
      icon: Users,
    },
    {
      label: 'Employees Scored',
      value: summary?.employees_scored ?? 0,
      icon: Activity,
    },
    {
      label: 'Average Performance',
      value: formatScore(summary?.average_score ?? null),
      icon: BarChart3,
    },
    {
      label: 'Finalized Reviews',
      value: summary?.finalized_reviews ?? 0,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="ap-page">
      <header className="ap-header">
        <div>
          <span className="ap-eyebrow">
            WORKPULSE 2.0 / ADMIN
          </span>
          <h1>Performance Analytics</h1>
          <p>
            Compare employee performance, task completion,
            and finalized reviews.
          </p>
        </div>

        <div className="ap-filters">
          <label htmlFor="analytics-month">Review Month</label>
          <input
            id="analytics-month"
            type="month"
            value={month}
            onChange={event => setMonth(event.target.value)}
          />
          <button
            type="button"
            onClick={() => void loadAnalytics()}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </header>

      {error && <div className="ap-error">{error}</div>}

      {loading ? (
        <div className="ap-loading">Loading analytics...</div>
      ) : data ? (
        <>
          <section className="ap-cards">
            {cards.map(card => {
              const Icon = card.icon;
              return (
                <article className="ap-card" key={card.label}>
                  <div className="ap-card-heading">
                    <span>{card.label}</span>
                    <Icon size={21} />
                  </div>
                  <strong>{card.value}</strong>
                </article>
              );
            })}
          </section>

          <section className="ap-chart-grid">
            <article className="ap-panel">
              <h2>Task Completion</h2>
              <p>Completed tasks for the selected period</p>

              <div className="ap-large-number">
                {formatScore(
                  summary?.task_completion_rate ?? null
                )}
              </div>

              <div className="ap-progress">
                <div
                  style={{
                    width: `${
                      summary?.task_completion_rate ?? 0
                    }%`,
                  }}
                />
              </div>

              <div className="ap-chart-foot">
                <ClipboardCheck size={17} />
                {summary?.completed_tasks ?? 0} of{' '}
                {summary?.total_tasks ?? 0} tasks completed
              </div>
            </article>

            <article className="ap-panel">
              <h2>Department Performance</h2>
              <p>Average provisional score by department</p>

              {data.departments.map(department => (
                <div
                  className="ap-department"
                  key={department.department}
                >
                  <div className="ap-department-label">
                    <strong>{department.department}</strong>
                    <span>
                      {formatScore(department.average_score)}
                    </span>
                  </div>
                  <div className="ap-progress">
                    <div
                      style={{
                        width: `${
                          department.average_score ?? 0
                        }%`,
                      }}
                    />
                  </div>
                  <small>
                    {department.employees} employee(s)
                  </small>
                </div>
              ))}

              {data.departments.length === 0 && (
                <p>No department data available.</p>
              )}
            </article>
          </section>

          <section className="ap-panel">
            <div className="ap-table-header">
              <div>
                <h2>Employee Performance Comparison</h2>
                <p>
                  Scores calculated using your existing
                  PerformanceService
                </p>
              </div>
              <span>{data.employees.length} employees</span>
            </div>

            <div className="ap-table-scroll">
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Tasks</th>
                    <th>Completion</th>
                    <th>On Time</th>
                    <th>Manager Review</th>
                    <th>Overall</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.employees.map(employee => (
                    <tr key={employee.employee_id}>
                      <td>
                        <strong>{employee.name}</strong>
                        <small>{employee.email}</small>
                      </td>
                      <td>{employee.department || 'â€”'}</td>
                      <td>
                        {employee.task_completed}/
                        {employee.task_total}
                      </td>
                      <td>
                        {formatScore(
                          employee.task_completion_score
                        )}
                      </td>
                      <td>
                        {formatScore(employee.on_time_score)}
                      </td>
                      <td>
                        {formatScore(employee.manager_score)}
                      </td>
                      <td>
                        <strong>
                          {formatScore(employee.overall_score)}
                        </strong>
                        {employee.is_partial &&
                          employee.overall_score !== null && (
                            <small>Provisional</small>
                          )}
                      </td>
                      <td>
                        <span
                          className={
                            employee.review_status === 'finalized'
                              ? 'ap-status finalized'
                              : 'ap-status pending'
                          }
                        >
                          {employee.review_status === 'finalized'
                            ? 'Finalized'
                            : 'Not finalized'}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {data.employees.length === 0 && (
                    <tr>
                      <td colSpan={8} className="ap-empty">
                        No employees found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <p className="ap-note">{data.note}</p>
        </>
      ) : null}
    </div>
  );
}
