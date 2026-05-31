import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useUpgrade } from '../contexts/UpgradeContext';
import { useToast } from '../contexts/ToastContext';
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
  const { showToast } = useToast();

  const [tab,           setTab]           = useState('live');   // 'live' | 'archived'
  const [videos,        setVideos]        = useState(null);
  const [archived,      setArchived]      = useState(null);
  const [videosLoading, setVideosLoading] = useState(true);
  const [archLoading,   setArchLoading]   = useState(false);
  const [promoVideos,   setPromoVideos]   = useState([]);

  // Strip OAuth token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('token')) {
      params.delete('token');
      const newUrl = window.location.pathname + (params.toString() ? `?${params}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Fetch live videos
  useEffect(() => {
    if (!user) return;
    api.get('/videos')
      .then(res => setVideos(res.data.videos))
      .catch(() => setVideos([]))
      .finally(() => setVideosLoading(false));
  }, [user?.id]);

  // Fetch archived videos when tab switches
  useEffect(() => {
    if (tab !== 'archived' || !user || archived !== null) return;
    setArchLoading(true);
    api.get('/videos/archived')
      .then(res => setArchived(res.data.videos))
      .catch(() => setArchived([]))
      .finally(() => setArchLoading(false));
  }, [tab, user?.id]);

  // Fetch promotion videos
  useEffect(() => {
    if (!user) return;
    api.get('/promotion-videos')
      .then(res => setPromoVideos(res.data.videos ?? []))
      .catch(() => {});
  }, [user?.id]);

  const hasPromo      = promoVideos.length > 0;
  const hasUserVideos = videos?.length > 0;

  function handleArchive(videoId) {
    setVideos(prev => (prev ?? []).filter(v => v.id !== videoId));
    setArchived(null); // force re-fetch archived list on next tab switch
    showToast('Video archived', 'info');
  }

  function handleRestore(videoId) {
    setArchived(prev => (prev ?? []).filter(v => v.id !== videoId));
    setVideos(null);    // force re-fetch live list
    setVideosLoading(true);
    api.get('/videos').then(res => setVideos(res.data.videos)).catch(() => setVideos([])).finally(() => setVideosLoading(false));
    showToast('Video restored', 'success');
  }

  function handleDelete(videoId) {
    setVideos(prev => (prev ?? []).filter(v => v.id !== videoId));
    updateUser({ video_count: Math.max(0, (user?.video_count ?? 1) - 1) });
  }

  return (
    <AppLayout>
      {/* Content header */}
      <div className="border-b border-gray-800 px-4 sm:px-6 py-3.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1">
          {/* Tabs */}
          {[{ id: 'live', label: 'Live' }, { id: 'archived', label: 'Archived' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
              {t.id === 'archived' && (archived?.length ?? 0) > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-gray-700 text-gray-400 rounded-full">
                  {archived.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          {tab === 'live' && (hasUserVideos || hasPromo) && (
            <AddVideoButton user={user} onVideoAdded={(v) => {
              setVideos(prev => [v, ...(prev ?? [])]);
              updateUser({ video_count: (user?.video_count ?? 0) + 1 });
            }} />
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {tab === 'live' ? (
          videosLoading ? (
            <LoadingSkeleton />
          ) : !hasUserVideos && !hasPromo ? (
            <EmptyState
              user={user}
              onVideoAdded={(video) => {
                setVideos([video]);
                updateUser({ video_count: (user?.video_count ?? 0) + 1 });
                navigate(`/dashboard/videos/${video.id}`);
              }}
            />
          ) : (
            <VideoList
              videos={videos ?? []}
              setVideos={setVideos}
              user={user}
              promoVideos={promoVideos}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          )
        ) : (
          /* Archived tab */
          <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
            {archLoading ? (
              <LoadingSkeleton />
            ) : !archived?.length ? (
              <div className="py-20 text-center">
                <p className="text-sm text-gray-400">No archived videos.</p>
                <p className="text-xs text-gray-500 mt-1">Archive a video from the Live tab to keep it out of your main list.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {archived.map(video => (
                  <ArchivedVideoCard
                    key={video.id}
                    video={video}
                    onRestore={() => handleRestore(video.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// VideoList
// ─────────────────────────────────────────────────────────────────────────

// ── Duration formatter ─────────────────────────────────────────────────

function fmtDuration(secs) {
  if (!secs || secs <= 0) return null;
  const s = Math.round(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const SOURCE_LABELS = {
  youtube     : 'YouTube',
  vimeo       : 'Vimeo',
  loom        : 'Loom',
  zoom        : 'Zoom',
  google_drive: 'Google Drive',
  dropbox     : 'Dropbox',
  mp4_direct  : 'Direct MP4',
  hls_stream  : 'HLS Stream',
  amazon_s3   : 'Amazon S3',
  azure_blob  : 'Azure Blob',
  other       : 'Video',
};

// ─────────────────────────────────────────────────────────────────────────
// VideoList
// ─────────────────────────────────────────────────────────────────────────

function VideoList({ videos, setVideos, user, promoVideos = [], onArchive, onDelete }) {
  const navigate = useNavigate();
  const hasUserVideos = videos.length > 0;
  const hasPromoVideos = promoVideos.length > 0;

  return (
    <div className="max-w-5xl w-full mx-auto px-6 py-8">

      {/* ── Promotion videos — pinned at top ─────────────────── */}
      {hasPromoVideos && (
        <div className={hasUserVideos ? 'mb-0' : 'mb-4'}>
          {/* "Featured" label */}
          <div className="flex items-center gap-2 mb-3">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"
              className="text-amber-400 flex-shrink-0">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">Featured</span>
          </div>
          <div className="flex flex-col gap-3">
            {promoVideos.map(video => (
              <PromoVideoCard
                key={video.promotion_id ?? video.id}
                video={video}
                onClick={() => navigate(`/dashboard/videos/${video.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Divider between promo and user videos ────────────── */}
      {hasPromoVideos && hasUserVideos && (
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-700/60" />
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Your Videos</span>
          <div className="flex-1 h-px bg-gray-700/60" />
        </div>
      )}

      {/* ── User's videos ─────────────────────────────────────── */}
      {hasUserVideos ? (
        <>
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
                onTitleUpdate={(newTitle) =>
                  setVideos(prev => prev.map(v => v.id === video.id ? { ...v, title: newTitle } : v))
                }
                onArchive={() => onArchive(video.id)}
                onDelete={() => onDelete(video.id)}
              />
            ))}
          </div>
        </>
      ) : hasPromoVideos ? (
        /* Promo videos visible but user has no own videos yet */
        <div className="mt-4">
          {user?.video_limit !== null && (
            <div className="mb-4">
              <VideoLimitBanner
                currentCount={user?.video_count ?? 0}
                videoLimit={user?.video_limit}
                currentPlan={user?.plan}
              />
            </div>
          )}
          <div className="py-8 border border-dashed border-gray-700/60 rounded-xl text-center">
            <p className="text-sm text-gray-400 mb-1">Ready to track your own videos?</p>
            <p className="text-xs text-gray-400">Click "Add video" above to paste a video URL and get started.</p>
          </div>
        </div>
      ) : null}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// VideoCard — redesigned with thumbnail, duration, embed btn, edit pencil
// ─────────────────────────────────────────────────────────────────────────

function VideoCard({ video, onClick, onTitleUpdate, onArchive, onDelete }) {
  const [showEmbed,    setShowEmbed]    = useState(false);
  const [showEdit,     setShowEdit]     = useState(false);
  const [showDelModal, setShowDelModal] = useState(false);
  const [embedCopied,  setEmbedCopied]  = useState(false);
  const [archiving,    setArchiving]    = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  const sourceLabel    = SOURCE_LABELS[video.source_type] ?? 'Video';
  const duration       = fmtDuration(video.duration_seconds);
  const totalViews     = (video.total_views    ?? 0).toLocaleString();
  const uniqueViews    = (video.unique_views   ?? 0).toLocaleString();
  const totalViewers   = (video.total_viewers  ?? 0).toLocaleString();
  const uniqueViewers  = (video.unique_session_viewers ?? video.unique_viewers ?? 0).toLocaleString();

  function handleEmbedCopy(e) {
    e.stopPropagation();
    const origin  = window.location.origin;
    const snippet = `<iframe\n  src="${origin}/embed/${video.id}"\n  width="560"\n  height="315"\n  frameborder="0"\n  allow="autoplay; fullscreen; picture-in-picture"\n  allowfullscreen>\n</iframe>`;
    navigator.clipboard.writeText(snippet)
      .then(() => { setEmbedCopied(true); setTimeout(() => setEmbedCopied(false), 2500); })
      .catch(() => {});
  }

  async function handleArchive(e) {
    e.stopPropagation();
    setArchiving(true);
    try {
      await api.patch(`/videos/${video.id}/archive`, { archive: true });
      onArchive();
    } catch {
      setArchiving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setShowDelModal(false);
    try {
      await api.delete(`/videos/${video.id}`);
      onDelete();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="bg-gray-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors">
        <div className="flex items-center gap-3 px-4 py-3">

          {/* Thumbnail with duration */}
          <button
            onClick={onClick}
            className="flex-shrink-0 relative w-24 h-14 rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden group/thumb"
          >
            {video.thumbnail_url
              ? <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
              : <VideoIcon className="text-gray-500" />
            }
            {/* Hover play overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-lg select-none">{'▶︎'}</span>
            </div>
            {/* Duration badge */}
            {duration && (
              <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] font-medium px-1 py-0.5 rounded leading-none pointer-events-none">
                {duration}
              </span>
            )}
          </button>

          {/* Title + meta — clicks to navigate */}
          <button onClick={onClick} className="flex-1 min-w-0 text-left">
            <p className="font-semibold text-gray-100 truncate">{video.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>{sourceLabel}</span>
              {/* Views & Viewers shown as stat columns on sm+; show inline on xs only */}
              <span className="sm:hidden text-gray-400">·</span>
              <span className="sm:hidden">{totalViewers} plays</span>
              <span className="sm:hidden text-gray-400">·</span>
              <span className="sm:hidden">{uniqueViewers} viewers</span>
            </p>
          </button>

          {/* Metric columns */}
          <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
            <StatCol label="Total Plays"     value={totalViewers}  />
            <StatCol label="Unique Viewers"  value={uniqueViewers} />
            <div className="hidden lg:block w-px h-8 bg-gray-700" />
            <StatCol label="Player Loads"    value={totalViews}    className="hidden lg:block" />
            <StatCol label="Unique Visitors" value={uniqueViews}   className="hidden lg:block" />
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {/* Embed copy */}
            <button
              onClick={handleEmbedCopy}
              title="Copy embed code"
              className={`p-1.5 rounded-lg transition-colors
                ${embedCopied
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'}`}
            >
              {embedCopied ? <CheckSmIcon /> : <EmbedIcon />}
            </button>

            {/* Edit title */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowEdit(true); }}
              title="Edit video name"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <PencilIcon />
            </button>

            {/* Archive */}
            <button
              onClick={handleArchive}
              disabled={archiving || deleting}
              title="Archive video"
              className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
            >
              {archiving
                ? <span className="w-3.5 h-3.5 border border-amber-400 border-t-transparent rounded-full animate-spin block" />
                : <ArchiveIcon />
              }
            </button>

            {/* Delete */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDelModal(true); }}
              disabled={deleting || archiving}
              title="Delete video"
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
            >
              {deleting
                ? <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin block" />
                : <TrashIcon />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Edit name modal */}
      {showEdit && (
        <EditNameModal
          video={video}
          onSave={(newTitle) => { onTitleUpdate(newTitle); setShowEdit(false); }}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* Delete confirmation modal */}
      {showDelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDelModal(false)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 mx-auto mb-4">
              <TrashIcon className="text-red-400" size={20} />
            </div>
            <h3 className="text-base font-bold text-gray-100 text-center mb-2">Delete video?</h3>
            <p className="text-sm text-gray-400 text-center leading-relaxed mb-6">
              This will permanently delete <span className="font-semibold text-gray-200">"{video.title}"</span> along with all its analytics data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-700 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 text-sm font-semibold text-white transition-colors"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ArchivedVideoCard — same bar as VideoCard but restore-only, no analytics
// ─────────────────────────────────────────────────────────────────────────

function ArchivedVideoCard({ video, onRestore }) {
  const { showToast } = useToast();
  const [restoring, setRestoring] = useState(false);
  const sourceLabel = SOURCE_LABELS[video.source_type] ?? 'Video';
  const duration    = fmtDuration(video.duration_seconds);

  async function handleRestore(e) {
    e.stopPropagation();
    setRestoring(true);
    try {
      await api.patch(`/videos/${video.id}/archive`, { archive: false });
      onRestore();
    } catch {
      setRestoring(false);
    }
  }

  return (
    <div
      className="bg-gray-800/50 border border-gray-700/50 rounded-xl opacity-75 hover:opacity-90 transition-opacity cursor-pointer"
      onClick={() => showToast('Restore the video to view its analytics', 'info')}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Thumbnail */}
        <div className="flex-shrink-0 relative w-24 h-14 rounded-lg bg-gray-700/60 flex items-center justify-center overflow-hidden">
          {video.thumbnail_url
            ? <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover grayscale" />
            : <VideoIcon className="text-gray-600" />
          }
          {duration && (
            <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] font-medium px-1 py-0.5 rounded leading-none">
              {duration}
            </span>
          )}
          {/* Archived overlay */}
          <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
            <ArchiveIcon className="text-gray-400" />
          </div>
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-400 truncate">{video.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{sourceLabel} · Archived</p>
        </div>

        {/* Restore button */}
        <button
          onClick={handleRestore}
          disabled={restoring}
          title="Restore to live"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                     bg-gray-700/60 text-gray-400 border border-gray-600/60
                     hover:bg-amber-500/15 hover:text-amber-400 hover:border-amber-500/30
                     disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {restoring
            ? <span className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
            : <RestoreIcon />
          }
          Restore
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PromoVideoCard — read-only card for admin-featured promotion videos
// ─────────────────────────────────────────────────────────────────────────

function PromoVideoCard({ video, onClick }) {
  const sourceLabel   = SOURCE_LABELS[video.source_type] ?? 'Video';
  const duration      = fmtDuration(video.duration_seconds);
  const totalViews    = (video.total_views    ?? 0).toLocaleString();
  const uniqueViews   = (video.unique_views   ?? 0).toLocaleString();
  const totalViewers  = (video.total_viewers  ?? 0).toLocaleString();
  const uniqueViewers = (video.unique_session_viewers ?? video.unique_viewers ?? 0).toLocaleString();

  return (
    <div className="bg-gray-800 border border-amber-500/25 rounded-xl hover:border-amber-500/50 transition-colors">
      <div className="flex items-center gap-3 px-4 py-3">

        {/* Thumbnail with duration */}
        <button
          onClick={onClick}
          className="flex-shrink-0 relative w-24 h-14 rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden group/thumb"
        >
          {video.thumbnail_url
            ? <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
            : <VideoIcon className="text-gray-500" />
          }
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-lg select-none">{'▶︎'}</span>
          </div>
          {duration && (
            <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] font-medium px-1 py-0.5 rounded leading-none pointer-events-none">
              {duration}
            </span>
          )}
        </button>

        {/* Title + meta */}
        <button onClick={onClick} className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-gray-100 truncate">{video.title}</p>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>{sourceLabel}</span>
            <span className="sm:hidden text-gray-400">·</span>
            <span className="sm:hidden">{totalViewers} plays</span>
            <span className="sm:hidden text-gray-400">·</span>
            <span className="sm:hidden">{uniqueViewers} viewers</span>
          </p>
        </button>

        {/* Metric columns */}
        <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
          <StatCol label="Total Plays"     value={totalViewers}  />
          <StatCol label="Unique Viewers"  value={uniqueViewers} />
          <div className="hidden lg:block w-px h-8 bg-gray-700" />
          <StatCol label="Player Loads"    value={totalViews}    className="hidden lg:block" />
          <StatCol label="Unique Visitors" value={uniqueViews}   className="hidden lg:block" />
        </div>

        {/* Featured indicator (replaces action icons) */}
        <div className="flex-shrink-0 ml-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400/50">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// StatCol — compact stat column used inside VideoCard
// ─────────────────────────────────────────────────────────────────────────

function StatCol({ label, value, className = '' }) {
  return (
    <div className={`text-center ${className}`}>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-gray-200 mt-0.5">{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EditNameModal — inline video rename
// ─────────────────────────────────────────────────────────────────────────

function EditNameModal({ video, onSave, onClose }) {
  const [title,   setTitle]   = useState(video.title);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSave(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || trimmed === video.title) { onClose(); return; }
    setSaving(true);
    setError('');
    try {
      await api.patch(`/videos/${video.id}`, { title: trimmed });
      onSave(trimmed);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not save. Try again.');
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6">
        <h2 className="text-base font-bold text-gray-50 mb-4">Rename video</h2>
        <form onSubmit={handleSave}>
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={500}
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          />
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          <div className="flex gap-2 mt-4 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || !title.trim()}
              className="px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AddVideoButton — inline URL form
// ─────────────────────────────────────────────────────────────────────────

function AddVideoButton({ user, onVideoAdded }) {
  const [open,       setOpen]       = useState(false);
  const [url,        setUrl]        = useState('');
  const [title,      setTitle]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const { updateUser } = useAuth();
  const { showUpgrade } = useUpgrade();
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // True when the user has used all their video slots
  const atLimit = user?.video_limit != null && (user?.video_count ?? 0) >= user?.video_limit;
  const nextPlan = user?.plan === 'free' ? 'starter' : 'pro';

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const trimmed = url.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const body = { url: trimmed };
      if (title.trim()) body.title = title.trim();
      const { data } = await api.post('/videos', body);
      updateUser({ video_count: (user?.video_count ?? 0) + 1 });
      onVideoAdded(data.video);
      setOpen(false);
      setUrl('');
      setTitle('');
      navigate('/videos');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    // Limit reached — gray out + show upgrade modal on click
    if (atLimit) {
      return (
        <button
          onClick={() => showUpgrade(nextPlan)}
          title={`Video limit reached — upgrade to add more videos`}
          className="flex items-center gap-1.5 px-3 py-1.5
                     bg-gray-700/80 text-gray-400 text-sm font-semibold rounded-lg
                     border border-gray-600/60 hover:bg-gray-600/80 hover:text-gray-300
                     transition-colors cursor-pointer"
        >
          <PlusIcon />
          Add video
        </button>
      );
    }
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
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-start">
      <input
        ref={inputRef}
        type="text"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="Paste video URL…"
        className="bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500
                   rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2
                   focus:ring-amber-500 focus:border-transparent w-52 sm:w-64"
        disabled={submitting}
      />
      <input
        type="text"
        value={title ?? ''}
        onChange={e => setTitle(e.target.value)}
        placeholder="Video title (optional)"
        className="bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500
                   rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2
                   focus:ring-amber-500 focus:border-transparent w-40 sm:w-52"
        disabled={submitting}
      />
      {error && <p className="w-full text-xs text-red-400 -mt-1">{error}</p>}
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
        onClick={() => { setOpen(false); setUrl(''); setTitle(''); setError(''); }}
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

        <p className="text-xs text-gray-500">
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
        <p className="text-sm text-gray-400">Loading your videos…</p>
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function EmbedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CheckSmIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TrashIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/>
      <rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-3.35"/>
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
