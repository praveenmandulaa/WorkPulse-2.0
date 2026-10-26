import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileText, Printer, RefreshCw } from 'lucide-react';
import './Reports.css';

type ReportType = 'employees' | 'tasks' | 'attendance' | 'performance';
type ReportData = {
  type: ReportType;
  month: string;
  columns: Record<string, string>;
  rows: Record<string, string | number | boolean | null>[];
  summary: { total_rows: number };
  note: string;
};
const API = import.meta.env.VITE_API_URL;
const todayMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const choices: { value: ReportType; label: string }[] = [
  { value: 'employees', label: 'Employees' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'performance', label: 'Performance' },
];

export default function Reports() {
  const [type, setType] = useState<ReportType>('employees');
  const [month, setMonth] = useState(todayMonth);
  const [department, setDepartment] = useState('');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const params = useMemo(() => {
    const query = new URLSearchParams({ type, month });
    if (department.trim()) query.set('department', department.trim());
    return query.toString();
  }, [type, month, department]);

  const loadReport = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/api/admin/reports?${params}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
      if (!signal?.aborted) setData(result.data);
    } catch (err) {
      if (signal?.aborted) return;
      setData(null);
      setError(err instanceof Error ? err.message : 'Unable to load report.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    const controller = new AbortController();
    void loadReport(controller.signal);
    return () => controller.abort();
  }, [loadReport]);

  async function downloadCsv() {
    setExporting(true);
    setError('');
    try {
      const response = await fetch(`${API}/api/admin/reports/export?${params}`, {
        credentials: 'include',
        headers: { Accept: 'text/csv' },
      });
      if (!response.ok) throw new Error(`CSV export failed (HTTP ${response.status}).`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workpulse_${type}_${month}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV export failed.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div>
          <span className="reports-eyebrow">WORKPULSE 2.0 / ADMIN</span>
          <h1>Reports Center</h1>
          <p>Generate, preview, export and print company reports.</p>
        </div>
        <FileText size={30} />
      </header>

      <section className="reports-panel reports-filters">
        <label>Report Type
          <select value={type} onChange={e => setType(e.target.value as ReportType)}>
            {choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
          </select>
        </label>
        <label>Month
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
        </label>
        <label>Department (optional)
          <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. IT" />
        </label>
        <button type="button" onClick={() => void loadReport()} disabled={loading}>
          <RefreshCw size={17} /> Refresh
        </button>
      </section>

      {error && <div className="reports-error" role="alert">{error}</div>}
      <section className="reports-panel reports-result">
        <div className="reports-result-header">
          <div>
            <h2>{choices.find(choice => choice.value === type)?.label} Report</h2>
            <p>{data?.summary.total_rows ?? 0} records Â· {month}</p>
          </div>
          <div className="reports-actions">
            <button type="button" onClick={() => void downloadCsv()} disabled={!data || loading || exporting}>
              <Download size={17} /> {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button type="button" onClick={() => window.print()} disabled={!data || loading}>
              <Printer size={17} /> Print / PDF
            </button>
          </div>
        </div>
        {loading ? <p className="reports-message">Loading report...</p> : data ? (
          <>
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead><tr>{Object.values(data.columns).map((label, index) => <th key={index}>{label}</th>)}</tr></thead>
                <tbody>
                  {data.rows.map((row, index) => (
                    <tr key={index}>{Object.keys(data.columns).map(key => (
                      <td key={key}>{row[key] === null || row[key] === undefined ? 'â€”' : String(row[key])}</td>
                    ))}</tr>
                  ))}
                  {data.rows.length === 0 && <tr><td colSpan={Object.keys(data.columns).length}>No records match these filters.</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="reports-note">{data.note}</p>
          </>
        ) : <p className="reports-message">No report loaded.</p>}
      </section>
    </div>
  );
}
