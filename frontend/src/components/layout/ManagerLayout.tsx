
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import './ManagerLayout.css';

const API = import.meta.env.VITE_API_URL;

function getXsrfToken(): string {
  const item = document.cookie
    .split('; ')
    .find(cookie => cookie.startsWith('XSRF-TOKEN='));

  return item
    ? decodeURIComponent(item.substring('XSRF-TOKEN='.length))
    : '';
}

const navigation = [
  {
    label: 'Overview',
    to: '/manager',
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: 'My Team',
    to: '/manager#team',
    icon: Users,
  },
  {
    label: 'Team Tasks',
    to: '/manager#tasks',
    icon: ClipboardList,
  },
  {
    label: 'Attendance',
    to: '/manager#attendance',
    icon: CalendarCheck,
  },
  {
    label: 'Performance Reviews',
    to: '/manager/performance',
    icon: TrendingUp,
  },
];

export default function ManagerLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    setLoggingOut(true);
    setError('');

    try {
      const response = await fetch(`${API}/api/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'X-XSRF-TOKEN': getXsrfToken(),
        },
      });

      if (!response.ok) {
        throw new Error('Unable to sign out. Please try again.');
      }

      // Full navigation resets the existing AuthContext.
      window.location.assign('/login');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Sign out failed.'
      );
      setLoggingOut(false);
    }
  }

  return (
    <div className="manager-layout">
      <aside className={`manager-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="manager-brand">
          <span className="manager-brand-icon">
            <Activity size={23} />
          </span>

          <div>
            <strong>
              WorkPulse <small>2.0</small>
            </strong>
            <span>Manager Workspace</span>
          </div>

          <button
            type="button"
            className="manager-close-menu"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <p className="manager-menu-label">WORKSPACE</p>

        <nav className="manager-nav">
          {navigation.map(item => {
            const Icon = item.icon;
            const isSection = item.to.includes('#');

            if (isSection) {
              return (
                <a
                  key={item.label}
                  href={item.to}
                  className="manager-nav-link"
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={19} />
                  {item.label}
                </a>
              );
            }

            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `manager-nav-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={19} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="manager-sidebar-bottom">
          <div className="manager-security">
            <CheckCircle2 size={16} />
            Manager-only workspace
          </div>

          <button
            type="button"
            className="manager-logout"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
          >
            <LogOut size={19} />
            {loggingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="manager-overlay"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="manager-content">
        <header className="manager-topbar">
          <button
            type="button"
            className="manager-mobile-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>

          <div className="manager-topbar-title">
            <span>WORKPULSE 2.0</span>
            <strong>Manager Portal</strong>
          </div>

          <span className="manager-role-badge">Manager</span>
        </header>

        {error && (
          <div className="manager-layout-error" role="alert">
            {error}
          </div>
        )}

        <main className="manager-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
