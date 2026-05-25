import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider }         from './contexts/ToastContext';
import { ThemeProvider }         from './contexts/ThemeContext';
import ImpersonationBanner from './components/ImpersonationBanner';
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

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        {/*
          ImpersonationBanner sits outside <Routes> so it persists across
          all route transitions during an active impersonation session.
          It renders nothing when isImpersonating is false.
        */}
        <ImpersonationBanner />
        <Routes>

          {/* ── Auth pages (public) ─────────────────────────── */}
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/set-password"    element={<SetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* ── Dashboard (protected) ──────────────────────── */}
          {/*
            /dashboard           → video list or empty state
            /dashboard/videos/:id → individual video analytics
            (video detail page built in Steps 11–14)
          */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
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
            path="/admin/onboarding"
            element={
              <AdminRoute>
                <OnboardingHealth />
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
      </ToastProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
