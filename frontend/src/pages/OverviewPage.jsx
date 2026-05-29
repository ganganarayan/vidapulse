'use strict';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

/**
 * OverviewPage — /dashboard
 *
 * Aggregate stats across all of the user's videos.
 * Distinct from /videos (the video management list).
 */
export default function OverviewPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [promoVideos, setPromoVideos] = useState([]);

  // Strip token param from OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('token')) {
      params.delete('token');
      const q = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (q ? `?${q}` : ''));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/user/overview')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    api.get('/promotion-videos')
      .then(r => setPromoVideos(r.data.videos ?? []))
      .catch(() => {});
  }, [user?.id]);

  function fmtWatchTime(secs) {
    if (!secs) return '0 min';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
        <h1 className="text-sm font-semibold text-gray-200">Overview</h1>
        <Link
          to="/videos"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400
                     text-gray-900 text-sm font-semibold rounded-lg transition-colors"
        >
          <PlusIcon />
          Add video
        </Link>
      </div>

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-32 gap-2 text-gray-500 text-sm">
            <span className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (!data || data.total_videos === 0) && promoVideos.length === 0 ? (
          <EmptyOverview />
        ) : (
          <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">

            {/* ── Featured / promotion videos ─────────────────────── */}
            {promoVideos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400 flex-shrink-0">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">Featured</span>
                </div>
                <div className="flex flex-col gap-2">
                  {promoVideos.map(video => (
                    <OverviewPromoRow
                      key={video.promotion_id ?? video.id}
                      video={video}
                      onClick={() => navigate(`/dashboard/videos/${video.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Stat cards (only when user has own videos) ──────── */}
            {data && data.total_videos > 0 && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Plays"     value={(data.total_viewers  ?? 0).toLocaleString()} icon={<PlaysCardIcon />} />
                  <StatCard label="Unique Viewers" value={(data.unique_viewers ?? 0).toLocaleString()} icon={<ViewersCardIcon />} />
                  <StatCard label="Player Loads"   value={(data.total_views    ?? 0).toLocaleString()} icon={<WatchCardIcon />} />
                  <StatCard label="Unique Visitors" value={(data.unique_views  ?? 0).toLocaleString()} icon={<VideoCardIcon />} />
                </div>

                {/* Watch time highlight */}
                {data.total_watch_seconds > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-5 py-4 flex items-center gap-4">
                    <ClockBigIcon />
                    <div className="flex-1">
                      <p className="text-2xl font-bold text-amber-400">{fmtWatchTime(data.total_watch_seconds)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">total watch time across {data.total_videos} {data.total_videos === 1 ? 'video' : 'videos'}</p>
                    </div>
                  </div>
                )}

                {/* ── Top videos ────────────────────────────────────── */}
                {data.top_videos?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                        Top Videos
                      </h2>
                      <Link to="/videos" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                        View all →
                      </Link>
                    </div>
                    <div className="flex flex-col gap-2">
                      {data.top_videos.map((video, i) => (
                        <TopVideoRow
                          key={video.id}
                          rank={i + 1}
                          video={video}
                          onClick={() => navigate(`/dashboard/videos/${video.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Quick nav tiles ─────────────────────────────────── */}
            <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                Explore
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { to: '/events',  label: 'Events',  desc: 'Live event stream',  icon: '📋' },
                  { to: '/funnels', label: 'Funnels', desc: 'Viewer journey',      icon: '▽' },
                  { to: '/reports', label: 'Reports', desc: 'Export & schedule',   icon: '📄' },
                  { to: '/alerts',  label: 'Alerts',  desc: 'Notification rules',  icon: '🔔' },
                ].map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4
                               hover:border-gray-600 hover:bg-gray-800/60 transition-colors group"
                  >
                    <span className="text-xl mb-2 block">{item.icon}</span>
                    <p className="text-sm font-semibold text-gray-200 group-hover:text-white">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// OverviewPromoRow — featured video row matching the Videos page card style
// ─────────────────────────────────────────────────────────────────────────

const SOURCE_LABELS_OV = {
  youtube: 'YouTube', vimeo: 'Vimeo', loom: 'Loom', zoom: 'Zoom',
  google_drive: 'Google Drive', dropbox: 'Dropbox',
  mp4_direct: 'Direct MP4', hls_stream: 'HLS Stream',
  amazon_s3: 'Amazon S3', azure_blob: 'Azure Blob', other: 'Video',
};

function fmtDurationOv(secs) {
  if (!secs || secs <= 0) return null;
  const s = Math.round(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
}

function OverviewPromoRow({ video, onClick }) {
  const sourceLabel   = SOURCE_LABELS_OV[video.source_type] ?? 'Video';
  const duration      = fmtDurationOv(video.duration_seconds);
  const totalViews    = (video.total_views    ?? 0).toLocaleString();
  const uniqueViews   = (video.unique_views   ?? 0).toLocaleString();
  const totalViewers  = (video.total_viewers  ?? 0).toLocaleString();
  const uniqueViewers = (video.unique_session_viewers ?? video.unique_viewers ?? 0).toLocaleString();

  return (
    <div className="bg-gray-800 border border-amber-500/25 rounded-xl hover:border-amber-500/50 transition-colors">
      <div className="flex items-center gap-3 px-4 py-3">

        {/* Thumbnail */}
        <button
          onClick={onClick}
          className="flex-shrink-0 relative w-24 h-14 rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden group/thumb"
        >
          {video.thumbnail_url
            ? <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
            : <VideoThumbIcon />
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
            <span className="sm:hidden text-gray-600">·</span>
            <span className="sm:hidden">{totalViewers} plays</span>
          </p>
        </button>

        {/* Metric columns */}
        <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
          <OvStatCol label="Total Plays"     value={totalViewers}  />
          <OvStatCol label="Unique Viewers"  value={uniqueViewers} />
          <div className="hidden lg:block w-px h-8 bg-gray-700" />
          <OvStatCol label="Player Loads"    value={totalViews}    className="hidden lg:block" />
          <OvStatCol label="Unique Visitors" value={uniqueViews}   className="hidden lg:block" />
        </div>

        {/* Featured star */}
        <div className="flex-shrink-0 ml-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400/50">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function OvStatCol({ label, value, className = '' }) {
  return (
    <div className={`text-center ${className}`}>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-gray-200 mt-0.5">{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-gray-600">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-50 tabular-nums">{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TopVideoRow
// ─────────────────────────────────────────────────────────────────────────

const SOURCE_LABELS = {
  youtube: 'YouTube', vimeo: 'Vimeo', loom: 'Loom', zoom: 'Zoom',
  google_drive: 'Google Drive', dropbox: 'Dropbox',
  mp4_direct: 'Direct MP4', hls_stream: 'HLS Stream',
  amazon_s3: 'Amazon S3', azure_blob: 'Azure Blob', other: 'Video',
};

function TopVideoRow({ rank, video, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-gray-800/40 border border-gray-700/50
                 rounded-xl px-4 py-3 hover:border-gray-600 hover:bg-gray-800/70
                 transition-colors text-left"
    >
      <span className="text-[11px] font-bold text-gray-600 w-4 text-center flex-shrink-0">
        {rank}
      </span>

      {/* Thumbnail */}
      <div className="w-14 h-9 rounded-lg bg-gray-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {video.thumbnail_url
          ? <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
          : <VideoThumbIcon />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-200 truncate">{video.title}</p>
        <p className="text-xs text-gray-500">{SOURCE_LABELS[video.source_type] ?? 'Video'}</p>
      </div>

      <div className="flex items-center gap-5 flex-shrink-0">
        <MiniStat label="Plays"          value={(video.total_plays    ?? 0).toLocaleString()} />
        <MiniStat label="Unique Viewers" value={(video.unique_viewers ?? 0).toLocaleString()} />
        <MiniStat label="Avg Watch"      value={`${parseFloat(video.avg_watch_pct ?? 0).toFixed(0)}%`} />
      </div>

      <ChevronRightIcon />
    </button>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="text-center hidden sm:block">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-gray-200">{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EmptyOverview — no videos yet
// ─────────────────────────────────────────────────────────────────────────

function EmptyOverview() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20
                        flex items-center justify-center mx-auto mb-5">
          <span className="text-amber-500 text-2xl select-none">{'▶︎'}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-50 mb-2">No data yet</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Add your first video to start seeing plays, viewers, and engagement stats here.
        </p>
        <Link
          to="/videos"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400
                     text-gray-900 font-semibold text-sm rounded-lg transition-colors"
        >
          <PlusIcon /> Go to Videos
        </Link>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────

const I = (p, extra = '') => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    className={`w-4 h-4 ${extra}`}>{p}</svg>
);

function VideoCardIcon()   { return I(<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>); }
function PlaysCardIcon()   { return I(<><polygon points="5 3 19 12 5 21 5 3"/></>); }
function ViewersCardIcon() { return I(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>); }
function WatchCardIcon()   { return I(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>); }
function VideoThumbIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>; }
function ChevronRightIcon(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 flex-shrink-0"><polyline points="9 18 15 12 9 6"/></svg>; }
function PlusIcon()        { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }

function ClockBigIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    </div>
  );
}
