
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Tasks from './pages/Tasks';
import Attendance from './pages/Attendance';
import EmployeeDashboard from './pages/EmployeeDashboard';

import AdminLayout from './components/layout/AdminLayout';
import ManagerLayout from './components/layout/ManagerLayout';

import ManagerDashboard from './pages/ManagerDashboard';
import ManagerPerformance from './pages/ManagerPerformance';
import MyPerformance from './pages/MyPerformance';
import AdminPerformance from './pages/AdminPerformance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />

          <Route path="/login" element={<Login />} />

          {/* Admin-only routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin']} />
            }
          >
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/employees" element={<Employees />} />
              <Route path="/admin/tasks" element={<Tasks />} />
              <Route path="/admin/attendance" element={<Attendance />} />
              <Route
                path="/admin/performance"
                element={<AdminPerformance />}
              />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Manager-only routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['manager']} />
            }
          >
            <Route element={<ManagerLayout />}>
              <Route
                path="/manager"
                element={<ManagerDashboard />}
              />
              <Route
                path="/manager/performance"
                element={<ManagerPerformance />}
              />
            </Route>
          </Route>

          {/* Employee-only routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['employee']} />
            }
          >
            <Route
              path="/employee"
              element={<EmployeeDashboard />}
            />
            <Route
              path="/employee/performance"
              element={<MyPerformance />}
            />
          </Route>

          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
