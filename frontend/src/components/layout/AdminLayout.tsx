
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, LayoutDashboard, Users, ClipboardList,
  CalendarCheck, ChartNoAxesCombined, FileBarChart2,
  Settings, LogOut, Menu, X, Bell, Search,
  ChevronRight, ShieldCheck,
  TruckElectric
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import '../../pages/Dashboard.css';

const links = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, ready: true },
  { label: 'Employees', path: '/admin/employees', icon: Users, ready: true },
  { label: 'Tasks', path: '/admin/tasks', icon: ClipboardList, ready: true },
  { label: 'Attendance', path: '/admin/attendance', icon: CalendarCheck, ready: TruckElectric },
  { label: 'Performance', path: '/admin/performance', icon: ChartNoAxesCombined, ready: true },
  { label: 'Reports', path: '/admin/reports', icon: FileBarChart2, ready: true },
  { label: 'Settings', path: '/admin/settings', icon: Settings, ready: true },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const currentPage =
    links.find(link => link.path === location.pathname)?.label || 'Dashboard';

  async function handleLogout() {
    setLoggingOut(true);
    setNotice('');

    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      setNotice('Unable to log out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="wp-shell">
      {menuOpen && (
        <button
          className="wp-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`wp-sidebar ${menuOpen ? 'wp-sidebar-open' : ''}`}>
        <div className="wp-logo">
          <div className="wp-logo-mark">
            <Activity size={23} />
          </div>
          <span>WorkPulse <small>2.0</small></span>
          <button
            className="wp-close"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="wp-nav-label">WORKSPACE</div>

        <nav className="wp-nav" aria-label="Main navigation">
          {links.map(({ label, path, icon: Icon, ready }) =>
            ready ? (
              <NavLink
                key={path}
                to={path}
                end
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `wp-nav-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={19} />
                <span>{label}</span>
              </NavLink>
              
            ) : (
              <button
                key={path}
                className="wp-nav-item"
                onClick={() => {
                  setNotice(`${label} module is coming in the next phase.`);
                  setMenuOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{label}</span>
                <span className="wp-soon">Soon</span>
              </button>
            )
          )}
        </nav>

        <div className="wp-sidebar-bottom">
          <div className="wp-security">
            <ShieldCheck size={18} />
            <span>Secure admin workspace</span>
          </div>

          <button
            className="wp-logout"
            disabled={loggingOut}
            onClick={handleLogout}
          >
            <LogOut size={19} />
            {loggingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="wp-main-area">
        <header className="wp-topbar">
          <div className="wp-topbar-left">
            <button
              className="wp-menu"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>

            <span className="wp-breadcrumb">
              Workspace <ChevronRight size={15} />
              <strong>{currentPage}</strong>
            </span>
          </div>

          <div className="wp-topbar-right">
            <div className="wp-search">
              <Search size={17} />
              <span>Search (coming soon)</span>
            </div>

            <button
              className="wp-icon-button"
              aria-label="Notifications coming soon"
              onClick={() => setNotice('Notifications are coming soon.')}
            >
              <Bell size={20} />
            </button>

            <div className="wp-profile">
              <span className="wp-avatar">
                {(user?.name || 'Admin')
                  .split(' ')
                  .map(name => name[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>

              <span className="wp-profile-text">
                <strong>{user?.name || 'Administrator'}</strong>
                <small>Administrator</small>
              </span>
            </div>
          </div>
        </header>

        {notice && (
          <div className="wp-notice" role="status">
            {notice}
            <button
              onClick={() => setNotice('')}
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <Outlet />
      </div>
    </div>
  );
}
