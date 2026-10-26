
import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import './MyTasks.css';

type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'completed'
  | 'blocked';

type Task = {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority?: string | null;
  due_date?: string | null;
  progress: number;
};

export default function MyTasks() {
    console.log('WORKPULSE MY TASKS COMPONENT MOUNTED');
      console.log('MyTasks component rendered');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/my-tasks');
        console.log('My assigned tasks API response:', response.data);

      setTasks(response.data.data ?? []);
    } catch {
          console.error('MyTasks API error:', error);

      setError('Unable to load assigned tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  async function updateTask(
    task: Task,
    status: TaskStatus,
    progress: number
  ) {
    setSavingId(task.id);
    setError('');
    setMessage('');

    try {
      await api.patch(`/api/tasks/${task.id}/status`, {
        status,
        progress,
      });

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? { ...item, status, progress }
            : item
        )
      );

      setMessage('Task updated successfully.');
    } catch {
      setError('Unable to update task. Please try again.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="my-tasks-panel">
      <div className="my-tasks-header">
        <div>
          <h2>My Assigned Tasks</h2>
          <p>View and update tasks assigned to you.</p>
        </div>

        <button
          type="button"
          onClick={() => void loadTasks()}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {loading && <p>Loading tasks...</p>}

      {!loading && tasks.length === 0 && !error && (
        <p>No tasks assigned to you yet.</p>
      )}

      {!loading && tasks.length > 0 && (
        <div className="my-tasks-table-wrap">
          <table className="my-tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <strong>{task.title}</strong>
                    <small>{task.description || 'No description'}</small>
                  </td>

                  <td>{task.priority || '-'}</td>

                  <td>{task.due_date?.slice(0, 10) || '-'}</td>

                  <td>{task.progress ?? 0}%</td>

                  <td>{task.status.replaceAll('_', ' ')}</td>

                  <td>
                    {task.status !== 'completed' && (
                      <>
                        <button
                          type="button"
                          disabled={savingId === task.id}
                          onClick={() =>
                            void updateTask(
                              task,
                              'in_progress',
                              Math.max(
                                10,
                                Math.min(task.progress ?? 0, 99)
                              )
                            )
                          }
                        >
                          Start / Resume
                        </button>

                        <button
                          type="button"
                          disabled={savingId === task.id}
                          onClick={() =>
                            void updateTask(
                              task,
                              'completed',
                              100
                            )
                          }
                        >
                          Complete
                        </button>
                      </>
                    )}

                    {task.status === 'completed' && (
                      <span>Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
