import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import InsightsSection      from './InsightsSection';
import HeatmapSection       from './HeatmapSection';
import ViewerStoriesSection from './ViewerStoriesSection';
import NotificationBell     from './NotificationBell';

/**
 * VideoAnalyticsView
 *
 * The full per-video dashboard. Used in two modes:
 *
 *   animateIn={true}  — first-time reveal (Step 11): elements stagger in one
 *                       by one, metrics count up from zero. Calls
 *                       onAnimationComplete when the sequence finishes.
 *
 *   animateIn={false} — static render: all elements immediately visible.
 *                       Used when the user navigates back to an existing video.
 *
 * Props:
 *   video               — video object from GET /api/videos/:id
 *   user                — user object from AuthContext
 *   animateIn           — boolean (default false)
 *   onAnimationComplete — called when the reveal finishes (animateIn only)
 *   onBack              — optional override for the "All videos" back button
 */

// ─────────────────────────────────────────────────────────────────────────
// Animation stage constants
// ─────────────────────────────────────────────────────────────────────────

// Total stages 0–7. Each stage makes one element group visible.
const STAGE_DELAYS = [
  0,     // 0 → 1: header
  300,   // 1 → 2: video title
  650,   // 2 → 3: metric card 1
  950,   // 3 → 4: metric card 2
  1250,  // 4 → 5: metric card 3
  1700,  // 5 → 6: judgment text
  2200,  // 6 → 7: action CTAs
];
const COMPLETE_DELAY = 2700; // fires onAnimationComplete

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const PLATFORM_LABELS = {
  youtube     : 'YouTube',
  vimeo       : 'Vimeo',
  loom        : 'Loom',
  zoom        : 'Zoom',
  google_drive: 'Google Drive',
  dropbox     : 'Dropbox',
  mp4_direct  : 'Direct video',
  hls_stream  : 'HLS stream',
  other       : 'Video',
};

/**
 * Derive contextual "judgment text" from the video's current stats.
 * Returns { headline, detail, colorClass }.
 */
function getJudgment(video) {
  const plays    = video?.total_plays    ?? 0;
  const avgWatch = parseFloat(video?.avg_watch_pct ?? 0);

  if (plays === 0) {
    return {
      headline  : 'Your tracker is live.',
      detail    : 'Share this video and your first insights will appear here automatically once viewers start watching.',
      colorClass: 'text-gray-300',
    };
  }

  if (plays < 10) {
    return {
      headline  : `${plays} play${plays !== 1 ? 's' : ''} so far.`,
      detail    : 'Insights sharpen with more data. Keep sharing to unlock your first analysis.',
      colorClass: 'text-amber-300',
    };
  }

  if (avgWatch >= 70) {
    return {
      headline  : 'Exceptional retention.',
      detail    : `Viewers watch ${avgWatch.toFixed(0)}% on average — well above the 40% industry benchmark. Your content is working.`,
      colorClass: 'text-emerald-300',
    };
  }

  if (avgWatch >= 50) {
    return {
      headline  : 'Solid retention.',
      detail    : `${avgWatch.toFixed(0)}% average watch time. Check the heatmap to find where engagement dips.`,
      colorClass: 'text-amber-300',
    };
  }

  if (avgWatch >= 30) {
    return {
      headline  : 'Room to improve.',
      detail    : `Viewers leave after ${avgWatch.toFixed(0)}% on average. A stronger opening hook could help significantly.`,
      colorClass: 'text-amber-300',
    };
  }

  return {
    headline  : 'High drop-off detected.',
    detail    : `Only ${avgWatch.toFixed(0)}% average watch time. Viewers are leaving fast — your intro may need rethinking.`,
    colorClass: 'text-red-300',
  };
}

// ─────────────────────────────────────────────────────────────────────────
// useCountUp — animates a number from 0 to `target` over `duration` ms.
// Starts only when `shouldStart` flips to true.
// ─────────────────────────────────────────────────────────────────────────

function useCountUp(target, duration = 900, shouldStart = true) {
  const [value, setValue] = useState(target === 0 ? 0 : 0);
  const rafRef   = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!shouldStart) return;
    if (target === 0) { setValue(0); return; }

    startRef.current = null;

    function tick(timestamp) {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed  = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic — fast start, slow finish
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, shouldStart]);

  return value;
}

// ─────────────────────────────────────────────────────────────────────────
// VideoAnalyticsView — main export
// ─────────────────────────────────────────────────────────────────────────

export default function VideoAnalyticsView({
  video,
  user,
  animateIn           = false,
  onAnimationComplete = null,
  onBack              = null,
}) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate('/dashboard'));

  // stage drives visibility. When animateIn=false, start at max stage so
  // everything renders immediately.
  const FULL_STAGE = 99;
  const [stage, setStage] = useState(animateIn ? 0 : FULL_STAGE);

  // Run the stage sequence only for animated reveals
  useEffect(() => {
    if (!animateIn) return;

    const timers = STAGE_DELAYS.map((delay, idx) =>
      setTimeout(() => setStage(idx + 1), delay)
    );

    const doneTimer = onAnimationComplete
      ? setTimeout(onAnimationComplete, COMPLETE_DELAY)
      : null;

    return () => {
      timers.forEach(clearTimeout);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [animateIn, onAnimationComplete]);

  // Derived display values
  const plays    = video?.total_plays    ?? 0;
  const viewers  = video?.unique_viewers ?? 0;
  const avgWatch = parseFloat(video?.avg_watch_pct ?? 0);
  const hasPlays = plays > 0;
  const judgment = getJudgment(video);

  // Secondary metrics from session aggregates
  const playRatePct    = parseFloat(video?.play_rate_pct    ?? 0);
  const completedViews = parseInt(video?.completed_views     ?? 0, 10);
  const totalWatchSecs = parseInt(video?.total_watch_seconds_sum ?? 0, 10);
  const totalWatchMins = Math.round(totalWatchSecs / 60);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header
        className={`border-b border-gray-800 px-4 sm:px-6 py-3
                    flex items-center justify-between
                    transition-all duration-500
                    ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`}
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <BackIcon />
          All videos
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 select-none">{'▶︎'}</span>
            <span className="font-bold text-amber-500 tracking-tight">VidaPulse</span>
          </div>
          {user && <PlanBadge plan={user.plan} displayName={user.plan_display_name} />}
          <NotificationBell />
          <Link
            to="/account"
            className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
            title="Settings"
          >
            <SettingsNavIcon />
          </Link>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">

        {/* ── Video title ─────────────────────────────────────────── */}
        <div
          className={`mb-8 transition-all duration-500
                      ${stage >= 2
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-3'}`}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-50 leading-tight">
            {video?.title ?? 'Untitled Video'}
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-2">
            <span>{PLATFORM_LABELS[video?.source_type] ?? 'Video'}</span>
            <span className="text-gray-700">·</span>
            <span>Added {video?.created_at ? new Date(video.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
          </p>
        </div>

        {/* ── 6 Metric cards (2 rows of 3) ────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {/* Row 1 — Primary KPIs */}
          <MetricCard
            label="Total Plays"
            value={plays}
            format={n => n.toLocaleString()}
            visible={stage >= 3}
            accent="amber"
          />
          <MetricCard
            label="Unique Viewers"
            value={viewers}
            format={n => n.toLocaleString()}
            visible={stage >= 4}
            accent="indigo"
          />
          <MetricCard
            label="Avg. Watch"
            value={hasPlays ? avgWatch : null}
            format={n => `${n.toFixed(0)}%`}
            visible={stage >= 5}
            accent="emerald"
          />
          {/* Row 2 — Engagement depth */}
          <MetricCard
            label="Play Rate"
            value={hasPlays ? playRatePct : null}
            format={n => `${n.toFixed(0)}%`}
            visible={stage >= 5}
            accent="violet"
          />
          <MetricCard
            label="Completions"
            value={hasPlays ? completedViews : null}
            format={n => n.toLocaleString()}
            visible={stage >= 5}
            accent="rose"
          />
          <MetricCard
            label="Total Watch Time"
            value={hasPlays ? totalWatchMins : null}
            format={n => n >= 60 ? `${(n / 60).toFixed(1)} hr` : `${n} min`}
            visible={stage >= 5}
            accent="sky"
          />
        </div>

        {/* ── Judgment text ───────────────────────────────────────── */}
        <div
          className={`mb-8 transition-all duration-600
                      ${stage >= 6
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-3'}`}
        >
          <p className={`text-lg font-semibold mb-1 ${judgment.colorClass}`}>
            {judgment.headline}
          </p>
          <p className="text-sm text-gray-400 max-w-xl leading-relaxed">
            {judgment.detail}
          </p>
        </div>

        {/* ── Action CTAs ─────────────────────────────────────────── */}
        <div
          className={`transition-all duration-500
                      ${stage >= 7
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-3'}`}
        >
          <ActionBar video={video} />
        </div>

        {/* ── Analytics sections ──────────────────────────────────── */}
        {stage >= 7 && (
          <AnalyticsSections video={video} user={user} />
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MetricCard — a single stat card with optional count-up animation
// ─────────────────────────────────────────────────────────────────────────

function MetricCard({ label, value, format, visible, accent }) {
  // Counter starts when the card becomes visible
  const numericValue  = typeof value === 'number' ? value : 0;
  const countedValue  = useCountUp(numericValue, 900, visible && value !== null);
  const isNull        = value === null;

  const accentMap = {
    amber  : 'border-t-amber-500/60',
    indigo : 'border-t-indigo-500/60',
    emerald: 'border-t-emerald-500/60',
    violet : 'border-t-violet-500/60',
    rose   : 'border-t-rose-500/60',
    sky    : 'border-t-sky-500/60',
  };

  return (
    <div
      className={`bg-gray-800 border border-gray-700 border-t-2 ${accentMap[accent] ?? accentMap.amber}
                  rounded-xl px-5 py-5 transition-all duration-500
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
        {label}
      </p>
      <p className="text-4xl font-bold text-gray-50 tabular-nums">
        {isNull ? '—' : format(countedValue)}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// generateEmbedSnippet — returns a self-contained <iframe> tag.
// The iframe loads /embed/:videoId which handles the player + all tracking
// automatically — no extra steps, no scripts on the embedding page.
// ─────────────────────────────────────────────────────────────────────────

function generateEmbedSnippet(videoId, origin) {
  return `<iframe
  src="${origin}/embed/${videoId}"
  width="560"
  height="315"
  frameborder="0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen>
</iframe>`;
}

// ─────────────────────────────────────────────────────────────────────────
// ActionBar — copy link + embed code CTA
// ─────────────────────────────────────────────────────────────────────────

function ActionBar({ video }) {
  const [copied,      setCopied]      = useState(false);
  const [embedOpen,   setEmbedOpen]   = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  function handleCopy() {
    const text = video?.original_url ?? '';
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(() => {});
  }

  function handleEmbedOpen() {
    setEmbedCopied(false);
    setEmbedOpen(true);
  }

  function handleEmbedCopy() {
    const snippet = generateEmbedSnippet(
      video?.id ?? '',
      typeof window !== 'undefined' ? window.location.origin : ''
    );
    navigator.clipboard.writeText(snippet)
      .then(() => { setEmbedCopied(true); setTimeout(() => setEmbedCopied(false), 3000); })
      .catch(() => {});
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700
                     border border-gray-700 text-sm text-gray-200 font-medium
                     rounded-lg transition-colors"
        >
          {copied ? <CheckSmallIcon className="text-emerald-400" /> : <CopyIcon />}
          {copied ? 'Copied!' : 'Copy video link'}
        </button>

        <button
          onClick={handleEmbedOpen}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20
                     border border-amber-500/30 text-sm text-amber-300 font-medium
                     rounded-lg transition-colors"
        >
          <CodeIcon />
          Get embed code
        </button>
      </div>

      {/* Embed code modal */}
      {embedOpen && (
        <EmbedModal
          video={video}
          copied={embedCopied}
          onCopy={handleEmbedCopy}
          onClose={() => setEmbedOpen(false)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EmbedModal — shows the tracking snippet with copy-to-clipboard
// ─────────────────────────────────────────────────────────────────────────

function EmbedModal({ video, copied, onCopy, onClose }) {
  const snippet = generateEmbedSnippet(
    video?.id ?? '',
    typeof window !== 'undefined' ? window.location.origin : ''
  );

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape
  React.useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-700
                      rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-50">Embed video</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-sm">
              {video?.title ?? 'Your video'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300
                       hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">

          {/* Instructions */}
          <p className="text-sm text-gray-400 mb-5">
            Copy the code below and paste it anywhere on your page — on any website, page builder, or canvas.
            Plays, watch time, and heatmap data will appear in this dashboard automatically.
          </p>

          {/* Code block */}
          <div className="relative">
            <pre
              className="bg-gray-950 border border-gray-800 rounded-xl
                         p-4 text-xs text-gray-300 font-mono leading-relaxed
                         overflow-x-auto whitespace-pre-wrap break-all"
            >
              {snippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center
                        justify-between gap-3 flex-shrink-0">
          <p className="text-xs text-gray-600">
            Works on any website or page builder · No scripts or extra setup needed
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200
                         bg-gray-800 hover:bg-gray-700 border border-gray-700
                         rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={onCopy}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                         rounded-lg transition-colors
                         bg-amber-500 hover:bg-amber-400 text-gray-900"
            >
              {copied
                ? <><CheckSmallIcon className="text-gray-900" /> Copied!</>
                : <><CopyIcon /> Copy embed code</>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AnalyticsSections
//
// Houses the three analytics areas built progressively across Steps 12–14.
//   Step 12 — InsightsSection (primary insight card + list)  ← live
//   Step 13 — HeatmapSection (engagement heatmap)            ← live
//   Step 14 — ViewerStoriesSection (4 narrative story cards) ← live
// ─────────────────────────────────────────────────────────────────────────

function AnalyticsSections({ video, user }) {
  return (
    <div className="mt-10 flex flex-col gap-10">
      <div className="h-px bg-gray-800" />

      {/* ── Insights (Step 12 — live) ─────────────────────────────── */}
      <InsightsSection
        videoId={video?.id}
        insightStatus={video?.insight_status}
        userPlan={user?.plan}
      />

      {/* ── Heatmap (Step 13 — live) ─────────────────────────────── */}
      <HeatmapSection
        videoId={video?.id}
        video={video}
        userPlan={user?.plan}
      />

      {/* ── Viewer Stories (Step 14 — live) ─────────────────────── */}
      <ViewerStoriesSection
        videoId={video?.id}
        userPlan={user?.plan}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shared UI pieces
// ─────────────────────────────────────────────────────────────────────────

function PlanBadge({ plan, displayName }) {
  const classes = {
    free          : 'bg-gray-700/60 text-gray-300 border-gray-600',
    starter       : 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    pro           : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    admin_lifetime: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  };
  return (
    <span className={`hidden sm:inline px-2 py-0.5 text-xs font-medium border rounded-full ${classes[plan] ?? classes.free}`}>
      {displayName ?? plan}
    </span>
  );
}

// ── Inline SVG icons ─────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckSmallIcon({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SettingsNavIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
