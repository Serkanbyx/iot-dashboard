import { Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/guards/ProtectedRoute";
import AdminRoute from "./components/guards/AdminRoute";
import GuestOnlyRoute from "./components/guards/GuestOnlyRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import HistoricalPage from "./pages/HistoricalPage";
import AlertsPage from "./pages/AlertsPage";
import SettingsPage from "./pages/SettingsPage";
import DevicesPage from "./pages/DevicesPage";
import UsersPage from "./pages/UsersPage";
import AuditPage from "./pages/AuditPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<GuestOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/historical" element={<HistoricalPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/audit" element={<AuditPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}
