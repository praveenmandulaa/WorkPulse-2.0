
import { useCallback, useEffect, useState } from 'react';
import './MyPerformance.css';

type TaskMetrics = {
  total: number;
  completed: number;
  on_time: number;
  completion_score: number | null;
  on_time_score: number | null;
};

type AttendanceMetrics = {
  recorded_days: number;
  present_days: number;
  late_days: number;
  absent_days: number;
  leave_days: number;
  attendance_score: number | null;
  note: string;
};

type PerformanceData = {
  period: string;
  tasks: TaskMetrics;
  attendance: AttendanceMetrics;
  manager_score: number | null;
  overall_score: number | null;
  available_weight: number;
  maximum_weight: number;
  is_partial: boolean;
};

type Review = {
  id: number;
  review_period: string;
  manager_score: string | number | null;
  status: string;
  strengths: string | null;
  improvements: string | null;
  feedback: string | null;
  reviewer?: { name: string };
};

const API = import.meta.env.VITE_API_URL;

export default function MyPerformance() {
  const [month, setMonth] = useState(
    new Date().toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      timeZone: 'Asia/Kolkata',
    }).slice(0, 7)
  );

  const [performance, setPerformance] =
    useState<PerformanceData | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [performanceResponse, reviewsResponse] =
        await Promise.all([
          fetch(
            `${API}/api/performance/my?month=${month}`,
            {
              credentials: 'include',
              headers: { Accept: 'application/json' },
            }
          ),
          fetch(`${API}/api/performance/reviews`, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
          }),
        ]);

      if (!performanceResponse.ok || !reviewsResponse.ok) {
        throw new Error('Unable to load performance information.');
      }

      const performanceJson = await performanceResponse.json();
      const reviewsJson = await reviewsResponse.json();

      setPerformance(performanceJson.data);
      setReviews(reviewsJson.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="myperf-page">
      <header className="myperf-header">
        <div>
          <p className="myperf-eyebrow">WORKPULSE / EMPLOYEE</p>
          <h1>My Performance</h1>
          <p>Track your progress and manager feedback.</p>
        </div>

        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
        />
      </header>

      {loading && <p>Loading performance...</p>}
      {error && <p className="myperf-error">{error}</p>}

      {!loading && performance && (
        <>
          <section className="myperf-stats">
            <article>
              <span>Overall Score</span>
              <strong>
                {performance.overall_score === null
                  ? 'N/A'
                  : `${performance.overall_score}%`}
              </strong>
              <small>
                {performance.is_partial
                  ? 'Provisional score'
                  : 'Complete score'}
              </small>
            </article>

            <article>
              <span>Task Completion</span>
              <strong>
                {performance.tasks.completion_score === null
                  ? 'N/A'
                  : `${performance.tasks.completion_score}%`}
              </strong>
              <small>
                {performance.tasks.completed} of{' '}
                {performance.tasks.total} tasks
              </small>
            </article>

            <article>
              <span>On-Time Delivery</span>
              <strong>
                {performance.tasks.on_time_score === null
                  ? 'N/A'
                  : `${performance.tasks.on_time_score}%`}
              </strong>
              <small>
                {performance.tasks.on_time} completed on time
              </small>
            </article>

            <article>
              <span>Manager Review</span>
              <strong>
                {performance.manager_score === null
                  ? 'Pending'
                  : `${performance.manager_score}%`}
              </strong>
              <small>Finalized review score</small>
            </article>
          </section>

          <section className="myperf-panel">
            <h2>Attendance Summary</h2>

            <div className="myperf-attendance">
              <div>
                <strong>{performance.attendance.recorded_days}</strong>
                <span>Recorded Days</span>
              </div>
              <div>
                <strong>{performance.attendance.present_days}</strong>
                <span>Present</span>
              </div>
              <div>
                <strong>{performance.attendance.late_days}</strong>
                <span>Late</span>
              </div>
              <div>
                <strong>{performance.attendance.leave_days}</strong>
                <span>Leave</span>
              </div>
            </div>

            <p className="myperf-note">
              {performance.attendance.note}
            </p>
          </section>
        </>
      )}

      <section className="myperf-panel">
        <h2>Manager Reviews</h2>

        {reviews.length === 0 && !loading && (
          <p>No finalized reviews available yet.</p>
        )}

        <div className="myperf-reviews">
          {reviews.map(review => (
            <article key={review.id} className="myperf-review">
              <div className="myperf-review-head">
                <div>
                  <h3>{review.review_period.slice(0, 7)}</h3>
                  <span>
                    Reviewed by {review.reviewer?.name ?? 'Manager'}
                  </span>
                </div>

                <strong>{review.manager_score ?? 'N/A'}%</strong>
              </div>

              <div className="myperf-feedback">
                <p><b>Strengths:</b> {review.strengths || 'N/A'}</p>
                <p><b>Improvements:</b> {review.improvements || 'N/A'}</p>
                <p><b>Feedback:</b> {review.feedback || 'N/A'}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
