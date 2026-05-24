import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';

import { useAuth } from '../auth/useAuth';
import { AdminLayout } from '../components/admin/AdminLayout';
import { LoadingState } from '../components/common/LoadingState';
import { EventTypesPage } from '../features/catalogs/EventTypesPage';
import { MediaPage } from '../features/catalogs/MediaPage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { EventCreatePage } from '../features/events/EventCreatePage';
import { EventDetailPage } from '../features/events/EventDetailPage';
import { EventEditPage } from '../features/events/EventEditPage';
import { EventListPage } from '../features/events/EventListPage';
import { SchedulesPage } from '../features/schedules/SchedulesPage';

function AdminRouteGuard({ children }: { children: ReactNode }) {
  const { checkingSession, isAuthenticated } = useAuth();

  if (checkingSession) {
    return <LoadingState label="Validando sesion..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/admin"
        element={
          <AdminRouteGuard>
            <AdminLayout />
          </AdminRouteGuard>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="events" element={<EventListPage />} />
        <Route path="events/new" element={<EventCreatePage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="events/:id/edit" element={<EventEditPage />} />
        <Route path="events/:eventId/schedules" element={<SchedulesPage />} />
        <Route path="schedules" element={<Navigate to="/admin/events" replace />} />
        <Route path="event-types" element={<EventTypesPage />} />
        <Route path="urls" element={<Navigate to="/admin/events" replace />} />
        <Route path="media" element={<MediaPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
