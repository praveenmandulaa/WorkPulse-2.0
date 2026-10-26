import { useCallback, useEffect, useState } from 'react';
import { Building2, CalendarClock, ChartNoAxesCombined, RotateCcw, Save } from 'lucide-react';
import './Settings.css';

type Group = 'company' | 'attendance' | 'performance';
type SettingsData = {
  company: { name: string; email: string; phone: string; address: string; timezone: string };
  attendance: { work_start: string; work_end: string; grace_minutes: number; working_days: number[] };
  performance: { task_completion_weight: number; on_time_delivery_weight: number; attendance_weight: number; manager_review_weight: number };
};
type ApiResponse<T> = { message?: string; data?: T; errors?: Record<string, string[]> };

const API = `${import.meta.env.VITE_API_URL}/api/admin/settings`;

const tabs: { key: Group; label: string; icon: typeof Building2 }[] = [
  { key: 'company', label: 'Company', icon: Building2 },
  { key: 'attendance', label: 'Attendance', icon: CalendarClock },
  { key: 'performance', label: 'Performance', icon: ChartNoAxesCombined },
];
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];


function getCookie(name: string): string | null {
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`));

  return cookie
    ? decodeURIComponent(cookie.substring(name.length + 1))
    : null;
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();

  const requiresCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');

  if (requiresCsrf) {
    const csrfResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/sanctum/csrf-cookie`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!csrfResponse.ok) {
      throw new Error(
        `Unable to initialize CSRF protection (${csrfResponse.status}).`
      );
    }

    const token = getCookie('XSRF-TOKEN');

    if (!token) {
      throw new Error(
        'CSRF cookie was not found. Check Laravel Sanctum and session configuration.'
      );
    }

    headers.set('X-XSRF-TOKEN', token);
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  let result: ApiResponse<T>;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      `Unexpected server response (HTTP ${response.status}).`
    );
  }

  if (!response.ok) {
    const validation = result.errors
      ? Object.values(result.errors).flat().join(' ')
      : '';

    throw new Error(
      validation ||
      result.message ||
      `Request failed (${response.status})`
    );
  }

  if (result.data === undefined || result.data === null) {
    throw new Error('Unexpected server response.');
  }

  return result.data;
}


export default function Settings() {
  const [active, setActive] = useState<Group>('company');
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setSettings(await request<SettingsData>(API)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load settings.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function update<K extends Group>(group: K, patch: Partial<SettingsData[K]>) {
    setSettings(previous => previous ? {
      ...previous,
      [group]: { ...previous[group], ...patch },
    } : previous);
    setMessage(''); setError('');
  }

  async function save() {
    if (!settings) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const updated = await request<SettingsData[Group]>(`${API}/${active}`, {
        method: 'PUT', body: JSON.stringify(settings[active]),
      });
      setSettings(previous => previous ? { ...previous, [active]: updated } : previous);
      setMessage('Settings saved successfully.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save settings.'); }
    finally { setBusy(false); }
  }

  async function reset() {
    if (!window.confirm(`Restore default ${active} settings?`)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const updated = await request<SettingsData[Group]>(`${API}/${active}/reset`, { method: 'POST' });
      setSettings(previous => previous ? { ...previous, [active]: updated } : previous);
      setMessage('Defaults restored.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to reset settings.'); }
    finally { setBusy(false); }
  }

  const weightTotal = settings ? Object.values(settings.performance).reduce((sum, n) => sum + n, 0) : 0;

  return (
    <main className="st-page">
      <div className="st-heading"><div><span className="st-eyebrow">WORKPULSE 2.0 / ADMIN</span><h1>Settings</h1><p>Manage company information, attendance policies and performance weights.</p></div></div>
      {error && <div className="st-alert st-error" role="alert">{error}</div>}
      {message && <div className="st-alert st-success" role="status">{message}</div>}
      {loading ? <div className="st-panel">Loading settings...</div> : settings ? (
        <div className="st-panel">
          <div className="st-tabs" role="tablist" aria-label="Settings sections">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" role="tab" aria-selected={active === key} className={active === key ? 'st-tab active' : 'st-tab'} onClick={() => { setActive(key); setMessage(''); setError(''); }}><Icon size={18} />{label}</button>
            ))}
          </div>
          {active === 'company' && <div className="st-form">
            <h2>Company Settings</h2>
            <div className="st-grid">
              <label>Company Name<input value={settings.company.name} onChange={e => update('company', { name: e.target.value })} /></label>
              <label>Company Email<input type="email" value={settings.company.email} onChange={e => update('company', { email: e.target.value })} /></label>
              <label>Phone Number<input value={settings.company.phone} onChange={e => update('company', { phone: e.target.value })} /></label>
              <label>Timezone<select value={settings.company.timezone} onChange={e => update('company', { timezone: e.target.value })}><option value="Asia/Kolkata">Asia/Kolkata</option><option value="UTC">UTC</option><option value="America/New_York">America/New_York</option><option value="Europe/London">Europe/London</option></select></label>
            </div>
            <label>Address<textarea rows={3} value={settings.company.address} onChange={e => update('company', { address: e.target.value })} /></label>
          </div>}
          {active === 'attendance' && <div className="st-form">
            <h2>Attendance Settings</h2><p className="st-note">These are organization defaults. Existing employee-specific shifts are not overwritten.</p>
            <div className="st-grid">
              <label>Work Start<input type="time" value={settings.attendance.work_start} onChange={e => update('attendance', { work_start: e.target.value })} /></label>
              <label>Work End<input type="time" value={settings.attendance.work_end} onChange={e => update('attendance', { work_end: e.target.value })} /></label>
              <label>Grace Period (minutes)<input type="number" min={0} max={120} value={settings.attendance.grace_minutes} onChange={e => update('attendance', { grace_minutes: Number(e.target.value) })} /></label>
            </div>
            <span className="st-field-title">Working Days</span>
            <div className="st-days">{dayLabels.map((day, index) => {
              const number = index + 1;
              return <label key={day}><input type="checkbox" checked={settings.attendance.working_days.includes(number)} onChange={e => update('attendance', { working_days: e.target.checked ? [...settings.attendance.working_days, number].sort() : settings.attendance.working_days.filter(d => d !== number) })} />{day}</label>;
            })}</div>
          </div>}
          {active === 'performance' && <div className="st-form">
            <h2>Performance Settings</h2><p className="st-note">Weights are stored now. The current PerformanceService still uses its existing scoring rules until we integrate these settings.</p>
            <div className="st-grid">{([
              ['task_completion_weight', 'Task Completion Weight'],
              ['on_time_delivery_weight', 'On-Time Delivery Weight'],
              ['attendance_weight', 'Attendance Weight'],
              ['manager_review_weight', 'Manager Review Weight'],
            ] as const).map(([key, label]) => <label key={key}>{label} (%)<input type="number" min={0} max={100} value={settings.performance[key]} onChange={e => update('performance', { [key]: Number(e.target.value) })} /></label>)}</div>
            <p className={weightTotal === 100 ? 'st-total valid' : 'st-total invalid'}>Total weight: {weightTotal}% {weightTotal !== 100 && '(must equal 100%)'}</p>
          </div>}
          <div className="st-actions"><button type="button" className="st-secondary" disabled={busy} onClick={() => void reset()}><RotateCcw size={17} /> Reset to Defaults</button><button type="button" className="st-primary" disabled={busy || (active === 'performance' && weightTotal !== 100)} onClick={() => void save()}><Save size={17} /> {busy ? 'Saving...' : 'Save Changes'}</button></div>
        </div>
      ) : null}
    </main>
  );
}
