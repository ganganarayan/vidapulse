import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

/**
 * NotificationBell
 *
 * Dashboard header component. Shows an unread count badge and, on click,
 * a dropdown panel listing recent in-app notifications.
 *
 * Polling: fetches notifications on mount and every 30 s while visible.
 * Mark as read: clicking a notification marks it read and navigates to the
 * linked video. "Mark all read" clears the badge in one call.
 *
 * Props: none (reads auth from API directly)
 */

const POLL_INTERVAL_MS = 30_000; // 30 s

export default function NotificationBell() {
  const navigate  = useNavigate();
  const bellRef   = useRef(null);
  const panelRef  = useRef(null);

  const [open,           setOpen]           = useState(false);
  const [notifications,  setNotifications]  = useState([]);
  const [loading,        setLoading]        = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Fetch notifications ───────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/user/notifications');
      setNotifications(data.notifications ?? []);
    } catch {
      /* Silently fail — bell is non-critical */
    }
  }, []);

  // Poll on mount + every 30 s
  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // ── Close on outside click ────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        bellRef.current  && !bellRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // ── Mark one notification as read ─────────────────────────────────────
  async function markRead(notification) {
    if (!notification.is_read) {
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
      api.put(`/user/notifications/${notification.id}/read`).catch(() => {});
    }
    setOpen(false);
    if (notification.video_id) {
      navigate(`/dashboard/videos/${notification.video_id}`);
    }
  }

  // ── Mark all as read ──────────────────────────────────────────────────
  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    api.put('/user/notifications/read-all').catch(() => {});
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={bellRef}
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg
                   text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1
                       bg-amber-500 text-gray-900 text-[9px] font-bold
                       rounded-full flex items-center justify-center leading-none"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-10 w-80 sm:w-96 bg-gray-800 border border-gray-700
                     rounded-xl shadow-2xl z-50 overflow-hidden"
          role="dialog"
          aria-label="Notifications"
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <span className="text-sm font-semibold text-gray-200">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <EmptyState />
            ) : (
              <ul>
                {notifications.map(n => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    onClick={() => markRead(n)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// NotificationRow
// ─────────────────────────────────────────────────────────────────────────

function NotificationRow({ notification, onClick }) {
  const isUnread = !notification.is_read;

  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full text-left px-4 py-3.5 flex items-start gap-3
                    hover:bg-gray-700/40 transition-colors border-b border-gray-700/50
                    last:border-0
                    ${isUnread ? 'bg-gray-700/20' : ''}`}
      >
        {/* Unread dot */}
        <span className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full
                          ${isUnread ? 'bg-amber-400' : 'bg-transparent'}`} />

        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug
                         ${isUnread ? 'text-gray-100 font-medium' : 'text-gray-400'}`}>
            {notification.headline}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatRelativeTime(notification.created_at)}
          </p>
        </div>

        {/* Arrow */}
        {notification.video_id && (
          <ArrowIcon className="flex-shrink-0 mt-1 text-gray-400" />
        )}
      </button>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="px-4 py-10 text-center">
      <div className="flex justify-center mb-3">
        <div className="w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center">
          <BellIcon className="text-gray-400" />
        </div>
      </div>
      <p className="text-sm text-gray-500">No notifications yet.</p>
      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
        Insights and milestones will appear here as your videos get views.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ─────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────

function BellIcon({ className = '' }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ArrowIcon({ className = '' }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
