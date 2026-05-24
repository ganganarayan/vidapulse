import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { VideoLimitBanner } from '../components/upgrade';
import NotificationBell from '../components/dashboard/NotificationBell';
import AppLayout from '../components/AppLayout';

/**
 * Dashboard
 *
 * Main video-list page. Wrapped in AppLayout (sidebar).
 *
 * States:
 *   loading      — fetching videos
 *   empty        — no videos yet
 *   has_videos   — video list
 */

// ── Platform detection ─────────────────────────────────────────────────
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
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [videos,        setVideos]        = useState(null);
  const [videosLoading, setVideosLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/videos')
      .then(res => setVideos(res.data.videos))
      .catch(() => setVideos([]))
      .finally(() => setVideosLoading(false));
  }, [user?.id]);

  return (
    <AppLayout>
      {/* Content header */}
      <div className="border-b border-gray-800 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
        <h1 className="text-sm font-semibold text-gray-200">Your Videos</h1>
        <div className="flex items-center gap-3">
          <NotificationBell />
          {videos?.length > 0 && (
            <AddVideoButton user={user} onVideoAdded={(v) => {
              setVideos(prev => [v, ...(prev ?? [])]);
              updateUser({ video_count: (user?.video_count ?? 0) + 1 });
            }} />
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {videosLoading ? (
          <LoadingSkeleton />
        ) : !videos?.length ? (
          <EmptyState
            user={user}
            onVideoAdded={(video) => {
              setVideos([video]);
              updateUser({ video_count: (user?.video_count ?? 0) + 1 });
              navigate(`/dashboard/videos/${video.id}`);
            }}
          />
        ) : (
          <VideoList videos={videos} user={user} />
        )}
      </main>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// VideoList
// ─────────────────────────────────────────────────────────────────────────

function VideoList({ videos, user }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl w-full mx-auto px-6 py-8">
      {/* Video limit banner */}
      {user?.video_limit !== null && (
        <div className="mb-5">
          <VideoLimitBanner
            currentCount={user?.video_count ?? 0}
            videoLimit={user?.video_limit}
            currentPlan={user?.plan}
          />
        </div>
      )}

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
  const SOURCE_LABELS = {
    youtube     : 'YouTube',
    vimeo       : 'Vimeo',
    loom        : 'Loom',
    zoom        : 'Zoom',
    google_drive: 'Google Drive',
    dropbox     : 'Dropbox',
    mp4_direct  : 'Direct MP4',
    hls_stream  : 'HLS stream',
    amazon_s3   : 'Amazon S3',
    azure_blob  : 'Azure Blob',
    other       : 'Video',
  };
  const sourceLabel = SOURCE_LABELS[video.source_type] ?? 'Video';

  const avgWatch = video.avg_watch_pct != null
    ? `${parseFloat(video.avg_watch_pct).toFixed(0)}%`
    : '—';

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gray-800 border border-gray-700 rounded-xl p-4
                 hover:border-gray-600 hover:bg-gray-750 transition-colors"
    >
      <div className="flex items-center gap-4">
        {/* Platform icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
          <VideoIcon className="text-gray-400" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-100 truncate">{video.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {sourceLabel} · Added {new Date(video.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <div className="flex-shrink-0 hidden sm:flex items-center gap-5 text-sm">
          <div className="text-right">
            <p className="font-semibold text-gray-200">{video.total_plays ?? 0}</p>
            <p className="text-xs text-gray-500">plays</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-200">{video.unique_viewers ?? 0}</p>
            <p className="text-xs text-gray-500">viewers</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-200">{avgWatch}</p>
            <p className="text-xs text-gray-500">avg watch</p>
          </div>
          <InsightBadge status={video.insight_status} />
        </div>
      </div>
    </button>
  );
}

function InsightBadge({ status }) {
  const map = {
    pending   : { label: 'Pending',    cls: 'bg-gray-700 text-gray-400' },
    generating: { label: 'Analysing',  cls: 'bg-amber-500/10 text-amber-300' },
    complete  : { label: 'Insights ready', cls: 'bg-emerald-500/10 text-emerald-300' },
    failed    : { label: 'Error',      cls: 'bg-red-500/10 text-red-300' },
  };
  const { label, cls } = map[status] ?? map.pending;
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cls}`}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AddVideoButton — inline URL form
// ─────────────────────────────────────────────────────────────────────────

function AddVideoButton({ user, onVideoAdded }) {
  const [open,       setOpen]       = useState(false);
  const [url,        setUrl]        = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const { updateUser } = useAuth();
  const inputRef = useRef(null);
  const navigate = useNavigate();

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
      navigate(`/dashboard/videos/${data.video.id}`);
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
        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400
                   text-gray-900 text-sm font-semibold rounded-lg transition-colors"
      >
        <PlusIcon />
        Add video
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-start">
      <div>
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste a video URL…"
          className="bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500
                     rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2
                     focus:ring-amber-500 focus:border-transparent w-52 sm:w-72"
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
        className="px-2 py-1.5 text-gray-500 hover:text-gray-300 text-sm"
      >
        Cancel
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EmptyState — no videos yet
// ─────────────────────────────────────────────────────────────────────────

function EmptyState({ user, onVideoAdded }) {
  const [url,         setUrl]         = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const trimmed = url.trim();
    if (!trimmed) { setError('Please paste a video URL.'); return; }
    try { new URL(trimmed); } catch {
      setError("That doesn't look like a valid URL. Make sure it starts with https://");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/videos', { url: trimmed });
      onVideoAdded(data.video);
    } catch (err) {
      if (err.response?.data?.error === 'plan_limit') {
        setError(`You've reached your video limit on the ${capitalize(user?.plan)} plan.`);
      } else if (err.response?.data?.fields?.url) {
        setError(err.response.data.fields.url[0]);
      } else {
        setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const platform   = detectPlatform(url.trim());
  const isValidUrl = (() => { try { new URL(url.trim()); return true; } catch { return false; } })();

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <span className="text-amber-500 text-3xl leading-none select-none">{'▶︎'}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-50 mb-3">
          Track your first video
        </h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Paste any video URL to see who's watching, where they drop off,
          and what keeps them hooked.
        </p>

        {user?.video_limit !== null && (
          <div className="mb-4">
            <VideoLimitBanner
              currentCount={user?.video_count ?? 0}
              videoLimit={user?.video_limit}
              currentPlan={user?.plan}
            />
          </div>
        )}

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
            {submitting
              ? <><span className="w-4 h-4 border-2 border-gray-900/40 border-t-gray-900 rounded-full animate-spin" />Analysing…</>
              : <>Analyse <ArrowRightIcon /></>
            }
          </button>
        </form>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-700/40 rounded-lg text-red-300 text-sm text-left">
            {error}
          </div>
        )}

        <p className="text-xs text-gray-600">
          YouTube · Vimeo · Loom · Zoom · Google Drive · Dropbox · Direct MP4 links
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// LoadingSkeleton
// ─────────────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading your videos…</p>
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
