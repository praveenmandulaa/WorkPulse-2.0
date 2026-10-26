
import { useCallback, useEffect, useState } from 'react';
import './ManagerPerformance.css';

type Employee = {
  id: number;
  department: string;
  designation: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

type Review = {
  id: number;
  employee_id: number;
  review_period: string;
  quality_rating: number;
  communication_rating: number;
  teamwork_rating: number;
  initiative_rating: number;
  manager_score: string | number | null;
  strengths: string | null;
  improvements: string | null;
  feedback: string | null;
  status: 'draft' | 'finalized';
  employee?: {
    user?: { name: string };
  };
};

type ReviewForm = {
  employee_id: number;
  review_period: string;
  quality_rating: number;
  communication_rating: number;
  teamwork_rating: number;
  initiative_rating: number;
  strengths: string;
  improvements: string;
  feedback: string;
};

const API = import.meta.env.VITE_API_URL;

function cookie(name: string): string {
  const item = document.cookie
    .split('; ')
    .find(c => c.startsWith(`${name}=`));

  return item
    ? decodeURIComponent(item.substring(name.length + 1))
    : '';
}

async function request<T>(
  path: string,
  method = 'GET',
  body?: unknown
): Promise<T> {
  const response = await fetch(`${API}/api/${path}`, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': cookie('XSRF-TOKEN'),
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `HTTP ${response.status}`);
  }

  return result as T;
}

const currentMonth = new Date().toLocaleDateString('en-CA', {
  year: 'numeric',
  month: '2-digit',
  timeZone: 'Asia/Kolkata',
}).slice(0, 7);

const emptyForm: ReviewForm = {
  employee_id: 0,
  review_period: currentMonth,
  quality_rating: 3,
  communication_rating: 3,
  teamwork_rating: 3,
  initiative_rating: 3,
  strengths: '',
  improvements: '',
  feedback: '',
};

const criteria = [
  ['quality_rating', 'Work Quality'],
  ['communication_rating', 'Communication'],
  ['teamwork_rating', 'Teamwork'],
  ['initiative_rating', 'Initiative'],
] as const;

export default function ManagerPerformance() {
  const [team, setTeam] = useState<Employee[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [form, setForm] = useState<ReviewForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const [teamResult, reviewResult] = await Promise.all([
        request<{ data: Employee[] }>('performance/team'),
        request<{ data: Review[] }>('performance/reviews'),
      ]);

      setTeam(teamResult.data);
      setReviews(reviewResult.data);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load reviews'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const score = Math.round(
    (
      form.quality_rating +
      form.communication_rating +
      form.teamwork_rating +
      form.initiative_rating
    ) / 20 * 100
  );

  function resetForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      employee_id: team[0]?.id ?? 0,
    });
  }

  function editReview(review: Review) {
    if (review.status === 'finalized') return;

    setEditingId(review.id);
    setForm({
      employee_id: review.employee_id,
      review_period: review.review_period.slice(0, 7),
      quality_rating: review.quality_rating,
      communication_rating: review.communication_rating,
      teamwork_rating: review.teamwork_rating,
      initiative_rating: review.initiative_rating,
      strengths: review.strengths ?? '',
      improvements: review.improvements ?? '',
      feedback: review.feedback ?? '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.employee_id) {
      setError('Please select an employee.');
      return;
    }

    try {
      setSaving(true);

      const path = editingId
        ? `performance/reviews/${editingId}`
        : 'performance/reviews';

      await request(
        path,
        editingId ? 'PUT' : 'POST',
        form
      );

      setSuccess(
        editingId
          ? 'Review updated successfully.'
          : 'Draft review created successfully.'
      );

      resetForm();
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save review'
      );
    } finally {
      setSaving(false);
    }
  }

  async function finalizeReview(id: number) {
    if (!window.confirm(
      'Finalize this review? It cannot be edited afterward.'
    )) return;

    try {
      setError('');
      setSuccess('');

      await request(
        `performance/reviews/${id}/finalize`,
        'POST'
      );

      setSuccess('Review finalized successfully.');
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to finalize review'
      );
    }
  }

  return (
    <div className="mp-page">
      <div className="mp-heading">
        <div>
          <p className="mp-eyebrow">WORKPULSE / MANAGER</p>
          <h1>Performance Reviews</h1>
          <p>Evaluate your team and track monthly performance.</p>
        </div>
        <button className="mp-secondary" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      <div className="mp-stats">
        <div className="mp-stat">
          <span>Team Members</span>
          <strong>{team.length}</strong>
        </div>
        <div className="mp-stat">
          <span>Total Reviews</span>
          <strong>{reviews.length}</strong>
        </div>
        <div className="mp-stat">
          <span>Finalized Reviews</span>
          <strong>
            {reviews.filter(r => r.status === 'finalized').length}
          </strong>
        </div>
      </div>

      {error && <div className="mp-alert mp-error">{error}</div>}
      {success && <div className="mp-alert mp-success">{success}</div>}

      <div className="mp-layout">
        <section className="mp-panel">
          <h2>{editingId ? 'Edit Draft Review' : 'New Review'}</h2>
          <p className="mp-muted">
            Ratings are scored from 1 to 5.
          </p>

          <form onSubmit={saveReview}>
            <label>
              Employee
              <select
                required
                value={form.employee_id || ''}
                disabled={editingId !== null}
                onChange={e => setForm({
                  ...form,
                  employee_id: Number(e.target.value),
                })}
              >
                <option value="">Select employee</option>
                {team.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.user.name} â€“ {employee.department}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Review Month
              <input
                type="month"
                required
                disabled={editingId !== null}
                value={form.review_period}
                onChange={e => setForm({
                  ...form,
                  review_period: e.target.value,
                })}
              />
            </label>

            {criteria.map(([field, label]) => (
              <div className="mp-rating" key={field}>
                <div className="mp-rating-head">
                  <span>{label}</span>
                  <strong>{form[field]}/5</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={form[field]}
                  onChange={e => setForm({
                    ...form,
                    [field]: Number(e.target.value),
                  })}
                />
              </div>
            ))}

            <div className="mp-score">
              <span>Manager Score</span>
              <strong>{score}%</strong>
            </div>

            <label>
              Strengths
              <textarea
                rows={3}
                value={form.strengths}
                onChange={e => setForm({
                  ...form,
                  strengths: e.target.value,
                })}
                placeholder="What is this employee doing well?"
              />
            </label>

            <label>
              Areas for Improvement
              <textarea
                rows={3}
                value={form.improvements}
                onChange={e => setForm({
                  ...form,
                  improvements: e.target.value,
                })}
                placeholder="What can be improved?"
              />
            </label>

            <label>
              Manager Feedback
              <textarea
                rows={3}
                value={form.feedback}
                onChange={e => setForm({
                  ...form,
                  feedback: e.target.value,
                })}
                placeholder="Write your overall evaluation..."
              />
            </label>

            <div className="mp-actions">
              <button
                type="submit"
                className="mp-primary"
                disabled={saving || team.length === 0}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Update Draft'
                    : 'Save Draft'}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  className="mp-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="mp-panel">
          <h2>Review History</h2>
          <p className="mp-muted">
            Monthly evaluations for your assigned team.
          </p>

          {loading && <p>Loading reviews...</p>}

          {!loading && reviews.length === 0 && (
            <p className="mp-muted">No reviews available yet.</p>
          )}

          <div className="mp-review-list">
            {reviews.map(review => (
              <article className="mp-review" key={review.id}>
                <div className="mp-review-top">
                  <div>
                    <h3>
                      {review.employee?.user?.name ??
                        `Employee #${review.employee_id}`}
                    </h3>
                    <span className="mp-muted">
                      {review.review_period.slice(0, 7)}
                    </span>
                  </div>

                  <span className={
                    review.status === 'finalized'
                      ? 'mp-badge mp-finalized'
                      : 'mp-badge mp-draft'
                  }>
                    {review.status}
                  </span>
                </div>

                <div className="mp-review-score">
                  {review.manager_score ?? 'N/A'}%
                </div>

                <div className="mp-actions">
                  {review.status === 'draft' && (
                    <>
                      <button
                        className="mp-secondary"
                        onClick={() => editReview(review)}
                      >
                        Edit
                      </button>

                      <button
                        className="mp-primary"
                        onClick={() =>
                          void finalizeReview(review.id)
                        }
                      >
                        Finalize
                      </button>
                    </>
                  )}

                  {review.status === 'finalized' && (
                    <span className="mp-muted">
                      Evaluation completed
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
