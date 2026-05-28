import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider }         from './contexts/ToastContext';
import { ThemeProvider }         from './contexts/ThemeContext';
import { UpgradeProvider }       from './contexts/UpgradeContext';
import ImpersonationBanner       from './components/ImpersonationBanner';
import UpgradeModal              from './components/UpgradeModal';
import { useVersionWatcher }     from './hooks/useVersionWatcher';
import Login             from './pages/Login';
import Register          from './pages/Register';
import SetPassword       from './pages/SetPassword';
import ForgotPassword    from './pages/ForgotPassword';
import ResetPassword     from './pages/ResetPassword';
import Dashboard         from './pages/Dashboard';
import VideoDetail       from './pages/VideoDetail';
import WebhookSettings   from './pages/WebhookSettings';
import OnboardingHealth  from './pages/OnboardingHealth';
import AdminUsers        from './pages/AdminUsers';
import AccountSettings   from './pages/AccountSettings';
import ScriptGenerator   from './pages/ScriptGenerator';
import OverviewPage      from './pages/OverviewPage';
import IntegrationsPage  from './pages/IntegrationsPage';
import HelpPage          from './pages/HelpPage';
import AdminHelpPage     from './pages/AdminHelpPage';
import EventsPage        from './pages/EventsPage';
import FunnelsPage       from './pages/FunnelsPage';
import AlertsPage        from './pages/AlertsPage';
import ReportsPage       from './pages/ReportsPage';
import CTATrackingPage   from './pages/CTATrackingPage';
import AdminWebhookLog   from './pages/AdminWebhookLog';
import AdminPromotionPage from './pages/AdminPromotionPage';
import AdminRevenue       from './pages/AdminRevenue';
import UpgradePage       from './pages/UpgradePage';
import PaymentSuccess    from './pages/PaymentSuccess';
import BillingPage       from './pages/BillingPage';

/**
 * ProtectedRoute
 *
 * Waits for AuthProvider to finish loading, then either:
 *   - Renders children (authenticated user)
 *   - Redirects to /login (no valid session)
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-amber-500 text-3xl select-none">{'▶︎'}</span>
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/**
 * AdminRoute
 *
 * Extends ProtectedRoute: additionally requires role='admin' or
 * plan='admin_lifetime'. Non-admins are redirected to /dashboard.
 */
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-amber-500 text-3xl select-none">{'▶︎'}</span>
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.plan !== 'admin_lifetime') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// Mounted inside the provider tree so the api helper works normally.
// Polls /api/version every 60 s and reloads when a new deploy is detected.
function VersionWatcher() {
  useVersionWatcher();
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
      <UpgradeProvider>
      <BrowserRouter>
        {/*
          ImpersonationBanner + UpgradeModal sit outside <Routes> so they
          persist across all route transitions.
          UpgradeModal renders nothing when upgradeTarget is null.
        */}
        <VersionWatcher />
        <ImpersonationBanner />
        <UpgradeModal />
        <Routes>

          {/* ── Auth pages (public) ─────────────────────────── */}
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/set-password"    element={<SetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* ── Overview (protected) — aggregate stats home ─── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <OverviewPage />
              </ProtectedRoute>
            }
          />

          {/* ── Videos list (protected) ────────────────────── */}
          <Route
            path="/videos"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Video detail (protected) ───────────────────── */}
          <Route
            path="/dashboard/videos/:id"
            element={
              <ProtectedRoute>
                <VideoDetail />
              </ProtectedRoute>
            }
          />

          {/* ── Account settings (protected) ──────────────────── */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountSettings />
              </ProtectedRoute>
            }
          />

          {/* ── Analytics pages (all authenticated users) ───────── */}
          <Route path="/events"       element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
          <Route path="/funnels"      element={<ProtectedRoute><FunnelsPage /></ProtectedRoute>} />
          <Route path="/cta-tracking" element={<ProtectedRoute><CTATrackingPage /></ProtectedRoute>} />
          <Route path="/alerts"       element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
          <Route path="/reports"      element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />

          {/* ── Upgrade / pricing (all authenticated users) ──────── */}
          <Route
            path="/upgrade"
            element={
              <ProtectedRoute>
                <UpgradePage />
              </ProtectedRoute>
            }
          />

          {/* ── Payment success / activation polling ─────────────── */}
          <Route
            path="/payment/:plan"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />

          {/* ── Billing history ───────────────────────────────────── */}
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <BillingPage />
              </ProtectedRoute>
            }
          />

          {/* ── Integrations (all authenticated users) ───────────── */}
          <Route
            path="/integrations"
            element={
              <ProtectedRoute>
                <IntegrationsPage />
              </ProtectedRoute>
            }
          />

          {/* ── Help & Support (all authenticated users) ─────────── */}
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <HelpPage />
              </ProtectedRoute>
            }
          />

          {/* ── Admin pages (admin role or admin_lifetime plan) ──── */}
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/webhook"
            element={
              <AdminRoute>
                <WebhookSettings />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/help"
            element={
              <AdminRoute>
                <AdminHelpPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/onboarding"
            element={
              <AdminRoute>
                <OnboardingHealth />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/webhook-log"
            element={
              <AdminRoute>
                <AdminWebhookLog />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/promotion"
            element={
              <AdminRoute>
                <AdminPromotionPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/revenue"
            element={
              <AdminRoute>
                <AdminRevenue />
              </AdminRoute>
            }
          />

          {/* ── Script Generator (standalone, no auth required) ── */}
          <Route path="/scripts" element={<ScriptGenerator />} />

          {/* ── Default redirects ──────────────────────────── */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </BrowserRouter>
      </UpgradeProvider>
      </ToastProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
