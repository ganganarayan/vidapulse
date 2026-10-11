/**
 * Axios instance for all VidaPulse API calls.
 *
 * withCredentials: true  — sends the httpOnly vp_token cookie on every request
 * baseURL: /api          — proxied to localhost:3000 in dev (vite.config.js)
 *                          hits the same origin in production
 *
 * Impersonation support:
 *   When an admin enters a subscriber's account, the impersonation JWT is stored
 *   in sessionStorage under the key 'vp_impersonation_token'.
 *   The request interceptor below detects this and injects it as
 *   Authorization: Bearer <token> — which takes precedence over the cookie
 *   in the backend's _extractToken() helper.
 *
 *   On 401 during an active impersonation session:
 *     - The impersonation token has expired (2-hour TTL)
 *     - Clear sessionStorage and redirect to /admin/users with an expiry flag
 */
import axios from 'axios';

const IMPERSONATION_KEY = 'vp_impersonation_token';

const api = axios.create({
  baseURL        : '/api',
  withCredentials: true,
  headers        : { 'Content-Type': 'application/json' },
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Inject impersonation token as Bearer header when active
api.interceptors.request.use(
  config => {
    const impToken = sessionStorage.getItem(IMPERSONATION_KEY);
    if (impToken) {
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${impToken}`;
    }
    return config;
  },
  err => Promise.reject(err)
);

// ── Response interceptor ─────────────────────────────────────────────────────
// Handle 401 responses
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const impToken = sessionStorage.getItem(IMPERSONATION_KEY);

      if (impToken) {
        // Impersonation session expired — clean up and redirect admin home
        sessionStorage.removeItem(IMPERSONATION_KEY);
        window.location.href = '/admin/users?impersonation_expired=1';
        return Promise.reject(err);
      }

      // Normal session expiry — redirect to login if not already on an auth page
      const authPages = ['/login', '/register', '/set-password', '/forgot-password', '/reset-password'];
      const isAuthPage = authPages.some(p => window.location.pathname.startsWith(p));
      if (!isAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

/**
 * Turn an axios failure into a message worth showing a human.
 *
 * Generic strings like "Failed to save" hide which of several very different
 * things went wrong. The server does not always send `message` — plenty of
 * routes reply `{ error: 'Not found' }` and nothing else — so read `message`,
 * then `error`, and always keep the HTTP status, which is what actually tells
 * a 404 (wrong/not-yours record) apart from a 403 (plan gate) or a 500.
 *
 * @param {object} err      the axios error
 * @param {string} fallback wording for "we got nothing useful back"
 * @returns {string}
 */
export function apiErrorMessage(err, fallback = 'Something went wrong.') {
  const res = err?.response;

  // No response at all — offline, DNS, CORS, or the request never completed.
  if (!res) return `${fallback} No response from the server${err?.message ? ` (${err.message})` : ''}.`;

  const body = (res.data && typeof res.data === 'object') ? res.data : {};
  const text = body.message || body.error;
  return text ? `${text} (HTTP ${res.status})` : `${fallback} HTTP ${res.status}.`;
}

export { IMPERSONATION_KEY };
export default api;
