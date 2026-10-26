
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      // Step 1: Initialize Laravel Sanctum CSRF protection
      await api.get('/sanctum/csrf-cookie');

      // Step 2: Authenticate with Laravel
      await api.post('/api/login', {
        email,
        password,
      });

      // Step 3: Update the global authentication state
      const authenticatedUser = await refreshUser();

      if (!authenticatedUser) {
        throw new Error('Unable to verify login session');
      }

      // Step 4: Redirect according to the authenticated role
      navigate(`/${authenticatedUser.role}`, {
        replace: true,
      });

    } catch (err) {
      console.error('Login error:', err);

      setError(
        'Login failed. Please check your credentials or server connection.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-brand">
        <div className="brand-name">
          <Activity size={30} />
          <span>WorkPulse</span>
        </div>

        <div>
          <h1>Smarter work. Better performance.</h1>
          <p>
            Manage employees, daily updates, tasks,
            and performance in one powerful workspace.
          </p>
        </div>

        <small>
          WorkPulse 2.0 • Employee Performance Platform
        </small>
      </section>

      <section className="login-form-section">
        <div className="login-card">
          <h2>Welcome back</h2>
          <p>Sign in to your WorkPulse account.</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>

            <div className="input-group">
              <Mail size={18} />
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <label htmlFor="password">Password</label>

            <div className="input-group">
              <LockKeyhole size={18} />
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="login-footer">
            © 2026 WorkPulse. All rights reserved.
          </div>
        </div>
      </section>
    </div>
  );
}
