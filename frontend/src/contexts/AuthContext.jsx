import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { IMPERSONATION_KEY } from '../lib/api';

/**
 * AuthContext
 *
 * Provides the authenticated user's profile and impersonation state to the app.
 *
 * Normal session shape of `user`:
 *   {
 *     id, email, name, role,
 *     plan,              ← 'free' | 'starter' | 'pro' | 'admin_lifetime'
 *     plan_display_name, ← 'Forever Free' | 'Starter' | 'Pro' | 'Admin Lifetime'
 *     video_limit,       ← integer | null (null = unlimited)
 *     video_count,       ← current active video count
 *     onboarding_completed,
 *     wow_moment_seen,
 *     first_video_id,
 *     created_at,
 *     preferences: { theme, timezone, email_notifications, insight_emails_enabled }
 *   }
 *
 * Impersonation state:
 *   isImpersonating     — boolean, true when admin has entered a subscriber account
 *   impersonationTarget — { id, email, name, plan } of the subscriber being viewed,
 *                         or null when not impersonating
 *
 * On 401: user remains null; the api.js interceptor redirects to /login
 * (unless already on an auth page, or unless an impersonation session just expired).
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,                setUser]                = useState(null);
  const [loading,             setLoading]             = useState(true);
  const [error,               setError]               = useState(null);
  const [isImpersonating,     setIsImpersonating]     = useState(false);
  const [impersonationTarget, setImpersonationTarget] = useState(null);

  // On mount: check sessionStorage for a live impersonation token so that
  // a page refresh during an impersonation session restores the impersonation UI
  useEffect(() => {
    const token = sessionStorage.getItem(IMPERSONATION_KEY);
    if (token) {
      try {
        // Decode (no verify — backend will verify on first API call)
        const parts   = token.split('.');
        const payload = JSON.parse(atob(parts[1]));

        // Check not yet expired (exp is in seconds)
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          setIsImpersonating(true);
          // impersonationTarget is populated after fetchUser resolves
        } else {
          // Token expired — clean up silently (api.js handles the redirect on next call)
          sessionStorage.removeItem(IMPERSONATION_KEY);
        }
      } catch {
        sessionStorage.removeItem(IMPERSONATION_KEY);
      }
    }
  }, []);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/user/me');
      setUser(data.user);
    } catch (err) {
      // 401 is handled by api.js interceptor
      if (err.response?.status !== 401) {
        setError(err.response?.data?.message ?? 'Failed to load user session');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  // refetch — call after login or plan upgrade to refresh user data
  const refetch = useCallback(() => fetchUser(), [fetchUser]);

  // updateUser — optimistically update a field without a full refetch
  const updateUser = useCallback((patch) => {
    setUser(prev => prev ? { ...prev, ...patch } : prev);
  }, []);

  // ── Impersonation ─────────────────────────────────────────────────────────

  /**
   * startImpersonation
   *
   * Called after POST /api/admin/impersonate/:userId succeeds.
   * Stores the impersonation token and reloads user data (now as the subscriber).
   *
   * @param {string} token       — the impersonation JWT
   * @param {object} targetUser  — { id, email, name, plan }
   */
  const startImpersonation = useCallback(async (token, targetUser) => {
    sessionStorage.setItem(IMPERSONATION_KEY, token);
    setIsImpersonating(true);
    setImpersonationTarget(targetUser);
    // Reload user so req.user reflects the subscriber (plan gates, video list, etc.)
    await fetchUser();
  }, [fetchUser]);

  /**
   * endImpersonation
   *
   * Calls POST /api/admin/impersonate/end, which:
   *   - Marks the session ended in DB
   *   - Issues a fresh admin JWT and sets it as the vp_token cookie
   * Then clears local impersonation state and re-fetches user as the admin.
   */
  const endImpersonation = useCallback(async () => {
    try {
      await api.post('/admin/impersonate/end');
    } catch (err) {
      // If 401 the token already expired — still clean up
      if (err.response?.status !== 401) {
        throw err;
      }
    } finally {
      sessionStorage.removeItem(IMPERSONATION_KEY);
      setIsImpersonating(false);
      setImpersonationTarget(null);
      await fetchUser();
    }
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      refetch,
      updateUser,
      isImpersonating,
      impersonationTarget,
      startImpersonation,
      endImpersonation,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth()
 *
 * Returns:
 *   { user, loading, error, refetch, updateUser,
 *     isImpersonating, impersonationTarget,
 *     startImpersonation, endImpersonation }
 *
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
