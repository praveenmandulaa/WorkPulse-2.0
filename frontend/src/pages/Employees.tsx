
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  Search, Plus, Pencil, Users, X,
  ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
  type Employee,
  type EmployeePayload,
  type EmployeePage,
} from '../api/employees';

import './Employees.css';

const emptyForm: EmployeePayload = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  employee_code: '',
  department: '',
  designation: '',
  joining_date: '',
  manager_id: null,
};

export default function Employees() {
  const [records, setRecords] = useState<EmployeePage | null>(null);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeePayload>(emptyForm);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getEmployees({
        search,
        department,
        status,
        page,
      });

      setRecords(result);
    } catch {
      setError('Unable to load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, department, status, page]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditing(employee);

    setForm({
      name: employee.user.name,
      email: employee.user.email,
      role: employee.user.role,
      employee_code: employee.employee_code,
      department: employee.department,
      designation: employee.designation,
      joining_date: employee.joining_date.slice(0, 10),
      manager_id: employee.manager_id,
    });

    setFormError('');
    setModalOpen(true);
  }

  function updateField<K extends keyof EmployeePayload>(
    field: K,
    value: EmployeePayload[K]
  ) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function saveEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      if (editing) {
        const { password: _password, ...payload } = form;
        void _password;
        await updateEmployee(editing.id, payload);
      } else {
        await createEmployee(form);
      }

      setModalOpen(false);
      await loadEmployees();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const response = err.response?.data;
        const validationErrors = response?.errors as
          | Record<string, string[]>
          | undefined;

        setFormError(
          validationErrors
            ? Object.values(validationErrors).flat().join(' ')
            : response?.message || 'Unable to save employee.'
        );
      } else {
        setFormError('An unexpected error occurred.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(employee: Employee) {
    const action = employee.user.is_active ? 'deactivate' : 'activate';

    if (!window.confirm(`Are you sure you want to ${action} ${employee.user.name}?`)) {
      return;
    }

    try {
      await toggleEmployeeStatus(employee.id);
      await loadEmployees();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || 'Unable to update status.'
          : 'Unable to update status.'
      );
    }
  }

  return (
    <main className="employees-page">
      <div className="employees-heading">
        <div>
          <span className="employees-eyebrow">WORKSPACE / EMPLOYEES</span>
          <h1>Employee Management</h1>
          <p>Manage your organization's employees and access.</p>
        </div>

        <button className="employees-primary" onClick={openCreate}>
          <Plus size={18} /> Add Employee
        </button>
      </div>

      <div className="employees-panel">
        <div className="employees-toolbar">
          <div className="employees-search">
            <Search size={18} />
            <input
              placeholder="Search name, email or employee ID..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <input
            className="employees-filter"
            placeholder="Department"
            value={department}
            onChange={e => {
              setDepartment(e.target.value);
              setPage(1);
            }}
          />

          <select
            className="employees-filter"
            value={status}
            onChange={e => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            className="employees-icon-btn"
            onClick={() => void loadEmployees()}
            title="Refresh employees"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {error && <p className="employees-error" role="alert">{error}</p>}

        <div className="employees-table-wrap">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="employees-empty">
                    Loading employees...
                  </td>
                </tr>
              ) : records?.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="employees-empty">
                    <Users size={32} />
                    <strong>No employees found</strong>
                    <span>Add your first employee to get started.</span>
                  </td>
                </tr>
              ) : (
                records?.data.map(employee => (
                  <tr key={employee.id}>
                    <td>
                      <div className="employee-person">
                        <span className="employee-avatar">
                          {employee.user.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span>
                          <strong>{employee.user.name}</strong>
                          <small>{employee.user.email}</small>
                        </span>
                      </div>
                    </td>
                    <td>{employee.employee_code}</td>
                    <td>{employee.department}</td>
                    <td>{employee.designation}</td>
                    <td>{employee.user.role}</td>
                    <td>
                      <span className={
                        employee.user.is_active
                          ? 'employee-status active'
                          : 'employee-status inactive'
                      }>
                        {employee.user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="employee-actions">
                        <button onClick={() => openEdit(employee)} title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => void changeStatus(employee)}>
                          {employee.user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="employees-pagination">
          <span>Total employees: {records?.total ?? 0}</span>
          <div>
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <span>Page {page} of {records?.last_page ?? 1}</span>
            <button
              disabled={loading || page >= (records?.last_page ?? 1)}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="employee-modal-backdrop">
          <div
            className="employee-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-form-title"
          >
            <div className="employee-modal-header">
              <h2 id="employee-form-title">
                {editing ? 'Edit Employee' : 'Add Employee'}
              </h2>
              <button onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveEmployee}>
              <div className="employee-form-grid">
                <label>
                  Full Name
                  <input required value={form.name}
                    onChange={e => updateField('name', e.target.value)} />
                </label>

                <label>
                  Email
                  <input required type="email" value={form.email}
                    onChange={e => updateField('email', e.target.value)} />
                </label>

                <label>
                  Employee ID
                  <input required value={form.employee_code}
                    onChange={e => updateField('employee_code', e.target.value)} />
                </label>

                <label>
                  Role
                  <select value={form.role}
                    onChange={e => updateField('role', e.target.value as EmployeePayload['role'])}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                </label>

                <label>
                  Department
                  <input required value={form.department}
                    onChange={e => updateField('department', e.target.value)} />
                </label>

                <label>
                  Designation
                  <input required value={form.designation}
                    onChange={e => updateField('designation', e.target.value)} />
                </label>

                <label>
                  Joining Date
                  <input required type="date" value={form.joining_date}
                    onChange={e => updateField('joining_date', e.target.value)} />
                </label>

                {!editing && (
                  <label>
                    Initial Password (12+ characters)
                    <input required type="password" minLength={12}
                      autoComplete="new-password"
                      value={form.password ?? ''}
                      onChange={e => updateField('password', e.target.value)} />
                  </label>
                )}
              </div>

              {formError && (
                <p className="employees-error" role="alert">{formError}</p>
              )}

              <div className="employee-form-footer">
                <button type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button className="employees-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
