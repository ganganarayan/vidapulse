import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { VideoLimitBanner } from '../components/upgrade';
import NotificationBell from '../components/dashboard/NotificationBell';

/**
 * Dashboard
 *
 * Main app page. Three render states:
 *
 *   1. loading       — skeleton screen while fetching videos
 *   2. empty         — no videos yet → URL input (Step 9)
 *   3. processing    — video submitted, awaiting processing (Step 10 fills this in)
 *   4. has_videos    — video list + analytics (Steps 11–14 fill this in)
 *
 * Protected: requires auth cookie. If /api/user/me returns 401,
 * the api.js interceptor redirects to /login.
 */

// ── Platform detection (mirrors backend logic) ─────────────────────────
function detectPlatform(url) {
  try {
    const { hostname } = new URL(url);
    const host = hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtube.com' || host === 'youtu.be') return 'YouTube';
    if (host === 'vimeo.com')                           return 'Vimeo';
    if (host === 'loom.com' || host.endsWith('.loom.com')) return 'Loom';
    if (host === 'zoom.us'  || host.endsWith('.zoom.us'))  return 'Zoom';
    if (host === 'drive.google.com')                    return 'Google Drive';
    if (host === 'dropbox.com')                         return 'Dropbox';
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [videos,        setVideos]        = useState(null);    // null = loading
  const [videosLoading, setVideosLoading] = useState(true);

  // Fetch video list on mount
  useEffect(() => {
    if (!user) return;
    api.get('/videos')
      .then(res => setVideos(res.data.videos))
      .catch(() => setVideos([]))
      .finally(() => setVideosLoading(false));
  }, [user?.id]);

  if (videosLoading) {
    return <DashboardShell user={user}><LoadingSkeleton /></DashboardShell>;
  }

  if (!videos?.length) {
    return (
      <DashboardShell user={user}>
        <EmptyState
          user={user}
          onVideoAdded={(video) => {
            setVideos([video]);
            updateUser({ video_count: (user?.video_count ?? 0) + 1 });
            // Navigation to video detail handled inside EmptyState
          }}
        />
      </DashboardShell>
    );
  }

  // Has videos — placeholder until Steps 11–14 build the analytics view
  return (
    <DashboardShell user={user}>
      <VideoList videos={videos} user={user} />
    </DashboardShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// DashboardShell — the persistent header + page wrapper
// ─────────────────────────────────────────────────────────────────────────

function DashboardShell({ user, children }) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <DashboardHeader user={user} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}

function DashboardHeader({ user }) {
  const navigate  = useNavigate();
  const { updateUser, isImpersonating } = useAuth();

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // Ignore errors — clear cookie regardless
    }
    navigate('/login', { replace: true });
  }

  return (
    <header className="border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-amber-500 text-xl">▶</span>
        <span className="text-lg font-bold text-amber-500 tracking-tight">VidaPulse</span>
      </div>

      {/* Right: plan badge + bell + user */}
      <div className="flex items-center gap-3">
        {user && <PlanBadge plan={user.plan} displayName={user.plan_display_name} />}
        {user && <NotificationBell />}
        {user && (
          <div className="flex items-center gap-2">
            <Link
                to="/account"
                className="hidden sm:block text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                {isImpersonating ? 'Admin' : user.name}
              </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded-md hover:bg-gray-800"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function PlanBadge({ plan, displayName }) {
  const classes = {
    free          : 'bg-gray-700/60 text-gray-300 border-gray-600',
    starter       : 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    pro           : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    admin_lifetime: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  };
  const cls = classes[plan] ?? classes.free;
  return (
    <span className={`px-2 py-0.5 text-xs font-medium border rounded-full ${cls}`}>
      {displayName ?? plan}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EmptyState — no videos yet
// ─────────────────────────────────────────────────────────────────────────

function EmptyState({ user, onVideoAdded }) {
  const navigate = useNavigate();
  const [url,         setUrl]         = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [submitted,   setSubmitted]   = useState(false);
  const inputRef = useRef(null);

  // Auto-focus the input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Basic client-side check before hitting the API
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please paste a video URL.');
      return;
    }
    try {
      new URL(trimmed); // throws if invalid
    } catch {
      setError('That doesn\'t look like a valid URL. Make sure it starts with https://');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/videos', { url: trimmed });
      // Pass new video up, then navigate to its detail page
      onVideoAdded(data.video);
      navigate(`/dashboard/videos/${data.video.id}`);
    } catch (err) {
      // Plan limit hit — show the structured error
      if (err.response?.data?.error === 'plan_limit') {
        setError(`You've reached your video limit on the ${capitalize(user?.plan)} plan. Upgrade to add more videos.`);
      } else if (err.response?.data?.fields?.url) {
        setError(err.response.data.fields.url[0]);
      } else {
        setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const platform    = detectPlatform(url.trim());
  const isValidUrl  = (() => { try { new URL(url.trim()); return true; } catch { return false; } })();

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <span className="text-amber-500 text-3xl leading-none">▶</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-50 mb-3">
          Track your first video
        </h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Paste any video URL to see who's watching, where they drop off,
          and what keeps them hooked.
        </p>

        {/* Video limit banner (shows at 80%+ usage — hidden for new users) */}
        {user?.video_limit !== null && (
          <div className="mb-4">
            <VideoLimitBanner
              currentCount={user?.video_count ?? 0}
              videoLimit={user?.video_limit}
              currentPlan={user?.plan}
            />
          </div>
        )}

        {/* URL input form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={e => { setUrl(e.target.value); setError(''); }}
              placeholder="https://www.youtube.com/watch?v=…"
              className="w-full bg-gray-800 border border-gray-700 text-gray-100
                         placeholder-gray-500 rounded-xl px-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         pr-24"
              disabled={submitting}
              autoComplete="off"
              spellCheck={false}
            />
            {/* Platform pill inside the input */}
            {platform && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5
                               bg-gray-700 text-gray-300 text-xs rounded-full pointer-events-none">
                {platform}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !url.trim()}
            className="flex-shrink-0 flex items-center justify-center gap-2
                       bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40
                       text-gray-900 font-semibold text-sm rounded-xl px-5 py-3
                       transition-colors disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-gray-900/40 border-t-gray-900 rounded-full animate-spin" />
                Analysing…
              </>
            ) : (
              <>
                Analyse
                <ArrowRightIcon />
              </>
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-700/40 rounded-lg text-red-300 text-sm text-left">
            {error}
          </div>
        )}

        {/* Supported platforms */}
        <p className="text-xs text-gray-600">
          YouTube&nbsp;·&nbsp;Vimeo&nbsp;·&nbsp;Loom&nbsp;·&nbsp;Zoom&nbsp;·&nbsp;Google Drive&nbsp;·&nbsp;Dropbox&nbsp;·&nbsp;Direct&nbsp;MP4&nbsp;links
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// VideoList — placeholder until Steps 11–14
// ─────────────────────────────────────────────────────────────────────────

function VideoList({ videos, user }) {
  const navigate = useNavigate();

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-50">Your Videos</h2>
        <AddVideoButton user={user} onVideoAdded={() => navigate('/dashboard')} />
      </div>

      {/* Video cards */}
      <div className="flex flex-col gap-3">
        {videos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => navigate(`/dashboard/videos/${video.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

function VideoCard({ video, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gray-800 border border-gray-700 rounded-xl p-4
                 hover:border-gray-600 transition-colors flex items-center gap-4"
    >
      {/* Platform icon placeholder */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
        <VideoIcon className="text-gray-400" />
      </div>

      {/* Video info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-100 truncate">{video.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {capitalize(video.source_type?.replace('_', ' '))} ·{' '}
          {new Date(video.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 hidden sm:flex items-center gap-6 text-sm">
        <div className="text-right">
          <p className="font-semibold text-gray-200">{video.total_plays ?? 0}</p>
          <p className="text-xs text-gray-500">plays</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-200">{video.unique_viewers ?? 0}</p>
          <p className="text-xs text-gray-500">viewers</p>
        </div>
        <StatusBadge status={video.insight_status} />
      </div>
    </button>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending   : { label: 'Pending',    cls: 'bg-gray-700 text-gray-400' },
    generating: { label: 'Analysing',  cls: 'bg-amber-500/10 text-amber-300' },
    complete  : { label: 'Ready',      cls: 'bg-emerald-500/10 text-emerald-300' },
    failed    : { label: 'Error',      cls: 'bg-red-500/10 text-red-300' },
  };
  const { label, cls } = map[status] ?? map.pending;
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cls}`}>
      {label}
    </span>
  );
}

function AddVideoButton({ user, onVideoAdded }) {
  const [open,       setOpen]       = useState(false);
  const [url,        setUrl]        = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const { updateUser } = useAuth();
  const inputRef = useRef(null);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const trimmed = url.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/videos', { url: trimmed });
      updateUser({ video_count: (user?.video_count ?? 0) + 1 });
      onVideoAdded(data.video);
      setOpen(false);
      setUrl('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400
                   text-gray-900 text-sm font-semibold rounded-lg transition-colors"
      >
        <PlusIcon />
        Add video
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div>
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste a video URL…"
          className="bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500
                     rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2
                     focus:ring-amber-500 focus:border-transparent w-56 sm:w-80"
          disabled={submitting}
        />
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={submitting || !url.trim()}
        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40
                   text-gray-900 text-sm font-semibold rounded-lg transition-colors"
      >
        {submitting ? '…' : 'Add'}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setUrl(''); setError(''); }}
        className="px-2 py-1.5 text-gray-500 hover:text-gray-300 text-sm transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// LoadingSkeleton — shown while fetching videos
// ─────────────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading your dashboard…</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ── Inline SVG icons ─────────────────────────────────────────────────────

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function VideoIcon({ className = '' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
