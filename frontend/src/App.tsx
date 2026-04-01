// Root application component. Defines three route groups:
//   /admin/*   — school_admin and school_teacher (AdminLayout)
//   /parent/*  — parent portal (PortalLayout)
//   /student/* — student portal (PortalLayout)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import PortalLayout from './components/layout/PortalLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import ExperiencesPage from './pages/admin/ExperiencesPage';
import ExperienceDetailPage from './pages/admin/ExperienceDetailPage';
import EnrolmentsPage from './pages/admin/EnrolmentsPage';
import CohortDetailPage from './pages/admin/CohortDetailPage';
import StudentDrilldownPage from './pages/admin/StudentDrilldownPage';
import PlaceholderPage from './pages/admin/PlaceholderPage';
import ParentDashboardPage from './pages/parent/ParentDashboardPage';
import ChildDetailPage from './pages/parent/ChildDetailPage';
import StudentDashboardPage from './pages/student/StudentDashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// Redirects unauthenticated users to /login. If `roles` is provided, also
// checks that the user's role is in the allowed list.
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Restricts a route to school_admin only; teachers are sent to /admin/experiences.
function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'school_admin') return <Navigate to="/admin/experiences" replace />;
  return <>{children}</>;
}

// Landing redirect: admins go to dashboard, teachers go to experiences.
function AdminIndex() {
  const { user } = useAuth();
  if (user?.role === 'school_admin') return <Navigate to="dashboard" replace />;
  return <Navigate to="experiences" replace />;
}

// Wraps /login — if already authenticated, redirects to the user's home page.
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (user.role === 'parent') return <Navigate to="/parent" replace />;
    if (user.role === 'student') return <Navigate to="/student" replace />;
    if (user.role === 'school_admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/admin/experiences" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />

            {/* Admin/Teacher routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['school_admin', 'school_teacher']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminIndex />} />
              <Route path="dashboard" element={<AdminOnly><DashboardPage /></AdminOnly>} />
              <Route path="experiences" element={<ExperiencesPage />} />
              <Route path="experiences/:id" element={<ExperienceDetailPage />} />
              <Route path="enrolments" element={<EnrolmentsPage />} />
              <Route path="cohorts/:cohortId" element={<CohortDetailPage />} />
              <Route path="students/:studentId" element={<StudentDrilldownPage />} />
              <Route path="curriculum" element={<PlaceholderPage />} />
              <Route path="credentials" element={<PlaceholderPage />} />
              <Route path="billing" element={<PlaceholderPage />} />
              <Route path="settings" element={<PlaceholderPage />} />
              <Route path="contact" element={<PlaceholderPage />} />
            </Route>

            {/* Parent routes */}
            <Route
              path="/parent"
              element={
                <ProtectedRoute roles={['parent']}>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ParentDashboardPage />} />
              <Route path="child/:studentId" element={<ChildDetailPage />} />
            </Route>

            {/* Student routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute roles={['student']}>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboardPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
