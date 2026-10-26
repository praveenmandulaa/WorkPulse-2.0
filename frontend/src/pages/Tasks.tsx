
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  Plus, Search, RefreshCw, Pencil, Archive,
  X, ClipboardList, CheckCircle2, Clock3, AlertCircle
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  getTasks, createTask, updateTask, updateTaskStatus,
  archiveTask,
  type Task, type TaskPayload, type TaskStatus,
  type TaskPriority, type PaginatedTasks
} from '../api/tasks';
import './Tasks.css';

type EmployeeOption = {
  id: number;
  user?: {
    id: number;
    name: string;
    is_active: boolean | number;
  };
};

const statuses: TaskStatus[] = [
  'todo', 'in_progress', 'in_review', 'completed', 'blocked'
];

const priorities: TaskPriority[] = [
  'low', 'medium', 'high', 'urgent'
];

const label = (value: string) =>
  value.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

const emptyForm: TaskPayload = {
  title: '',
  description: '',
  assigned_to: 0,
  priority: 'medium',
  start_date: null,
  due_date: null
};

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const validation = data?.errors as Record<string, string[]> | undefined;
    if (validation) {
      const first = Object.values(validation).flat()[0];
      if (first) return first;
    }
    return data?.message || 'Request failed. Check the API connection.';
  }
  return 'An unexpected error occurred.';
}

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'completed') return false;
  const due = task.due_date.slice(0, 10);
  const today = new Date();
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');
  return due < localToday;
}

export default function Tasks() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const [result, setResult] = useState<PaginatedTasks | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskPayload>(emptyForm);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTasks({
        page, search: search.trim(), status, priority
      });
      setResult(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, priority]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (!canManage) return;

    let active = true;
    async function loadEmployees() {
      try {
        const response = await api.get('/api/employees', {
          params: { per_page: 100 }
        });
        if (active) {
          setEmployees(response.data.data ?? []);
        }
      } catch {
        if (active) setEmployees([]);
      }
    }
    void loadEmployees();
    return () => { active = false; };
  }, [canManage]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setError('');
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description ?? '',
      assigned_to: task.assigned_to,
      priority: task.priority,
      start_date: task.start_date?.slice(0, 10) ?? null,
      due_date: task.due_date?.slice(0, 10) ?? null
    });
    setError('');
    setModalOpen(true);
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (editing) {
        await updateTask(editing.id, form);
      } else {
        await createTask(form);
      }
      setModalOpen(false);
      setNotice(editing ? 'Task updated successfully.' : 'Task created successfully.');
      await loadTasks();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(task: Task, next: TaskStatus) {
    const progress = next === 'completed'
      ? 100
      : task.status === 'completed'
        ? 0
        : Math.min(task.progress, 99);

    setBusy(true);
    setError('');
    try {
      await updateTaskStatus(task.id, next, progress);
      setNotice('Task status updated.');
      await loadTasks();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeTask(task: Task) {
    if (!window.confirm(`Archive "${task.title}"?`)) return;
    setBusy(true);
    setError('');
    try {
      await archiveTask(task.id);
      setNotice('Task archived successfully.');
      await loadTasks();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const tasks = result?.data ?? [];
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const overdue = tasks.filter(isOverdue).length;

  return (
    <main className="wp-content task-page">
      <div className="task-heading">
        <div>
          <div className="wp-eyebrow">WORKSPACE / TASKS</div>
          <h1>Task Management</h1>
          <p>Assign, manage and monitor your team's work.</p>
        </div>
        {canManage && (
          <button className="task-primary" onClick={openCreate}>
            <Plus size={18} /> Create Task
          </button>
        )}
      </div>

      {notice && (
        <div className="task-notice" role="status">
          {notice}
          <button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16}/></button>
        </div>
      )}
      {error && !modalOpen && <div className="task-error" role="alert">{error}</div>}

      <div className="task-stats">
        <article><ClipboardList/><span>Total tasks</span><strong>{result?.total ?? 0}</strong></article>
        <article><Clock3/><span>In progress (page)</span><strong>{inProgress}</strong></article>
        <article><CheckCircle2/><span>Completed (page)</span><strong>{completed}</strong></article>
        <article><AlertCircle/><span>Overdue (page)</span><strong>{overdue}</strong></article>
      </div>

      <section className="task-panel">
        <div className="task-filters">
          <div className="task-search">
            <Search size={18}/>
            <input
              aria-label="Search tasks"
              placeholder="Search tasks..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select aria-label="Filter by status" value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {statuses.map(s => <option key={s} value={s}>{label(s)}</option>)}
          </select>

          <select aria-label="Filter by priority" value={priority}
            onChange={e => { setPriority(e.target.value); setPage(1); }}>
            <option value="">All priorities</option>
            {priorities.map(p => <option key={p} value={p}>{label(p)}</option>)}
          </select>

          <button className="task-icon-btn" aria-label="Refresh tasks"
            onClick={() => void loadTasks()} disabled={loading}>
            <RefreshCw size={18}/>
          </button>
        </div>

        <div className="task-table-scroll">
          <table className="task-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Assigned to</th>
                <th>Priority</th>
                <th>Progress</th>
                <th>Due date</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={canManage ? 7 : 6}>Loading tasks...</td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan={canManage ? 7 : 6}>No tasks found.</td></tr>
              ) : tasks.map(task => (
                <tr key={task.id}>
                  <td>
                    <strong>{task.title}</strong>
                    <small>{task.description || 'No description'}</small>
                  </td>
                  <td>{task.assignee?.name ?? `User #${task.assigned_to}`}</td>
                  <td><span className={`task-badge priority-${task.priority}`}>{label(task.priority)}</span></td>
                  <td>
                    <div className="task-progress">
                      <div style={{ width: `${task.progress}%` }}/>
                    </div>
                    <small>{task.progress}%</small>
                  </td>
                  <td>
                    {task.due_date?.slice(0, 10) ?? '—'}
                    {isOverdue(task) && <small className="task-overdue">Overdue</small>}
                  </td>
                  <td>
                    <select
                      className="task-status-select"
                      aria-label={`Status for ${task.title}`}
                      value={task.status}
                      disabled={busy}
                      onChange={e => void changeStatus(task, e.target.value as TaskStatus)}
                    >
                      {statuses.map(s => <option key={s} value={s}>{label(s)}</option>)}
                    </select>
                  </td>
                  {canManage && (
                    <td>
                      <div className="task-actions">
                        <button title="Edit task" disabled={busy} onClick={() => openEdit(task)}>
                          <Pencil size={17}/>
                        </button>
                        <button title="Archive task" disabled={busy} onClick={() => void removeTask(task)}>
                          <Archive size={17}/>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="task-pagination">
          <span>Total: {result?.total ?? 0} tasks</span>
          <div>
            <button disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span>Page {result?.current_page ?? page} of {result?.last_page ?? 1}</span>
            <button disabled={loading || page >= (result?.last_page ?? 1)}
              onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </section>

      {modalOpen && (
        <div className="task-modal-backdrop">
          <section className="task-modal" role="dialog" aria-modal="true"
            aria-labelledby="task-modal-title">
            <div className="task-modal-header">
              <h2 id="task-modal-title">{editing ? 'Edit Task' : 'Create Task'}</h2>
              <button aria-label="Close" disabled={busy} onClick={() => setModalOpen(false)}>
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={saveTask}>
              <label>Task title
                <input required maxLength={200} value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}/>
              </label>

              <label>Description
                <textarea rows={3} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}/>
              </label>

              <div className="task-form-grid">
                <label>Assign to
                  <select required value={form.assigned_to || ''}
                    onChange={e => setForm({ ...form, assigned_to: Number(e.target.value) })}>
                    <option value="">Select employee</option>
                    {employees.filter(e => e.user && Boolean(Number(e.user.is_active))).map(e => (
                      <option key={e.user!.id} value={e.user!.id}>{e.user!.name}</option>
                    ))}
                  </select>
                </label>

                <label>Priority
                  <select value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                    {priorities.map(p => <option key={p} value={p}>{label(p)}</option>)}
                  </select>
                </label>

                <label>Start date
                  <input type="date" value={form.start_date ?? ''}
                    onChange={e => setForm({ ...form, start_date: e.target.value || null })}/>
                </label>

                <label>Due date
                  <input type="date" min={form.start_date ?? undefined}
                    value={form.due_date ?? ''}
                    onChange={e => setForm({ ...form, due_date: e.target.value || null })}/>
                </label>
              </div>

              {error && <div className="task-error" role="alert">{error}</div>}

              <div className="task-modal-footer">
                <button type="button" className="task-secondary"
                  disabled={busy} onClick={() => setModalOpen(false)}>Cancel</button>
                <button className="task-primary" type="submit" disabled={busy}>
                  {busy ? 'Saving...' : editing ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
