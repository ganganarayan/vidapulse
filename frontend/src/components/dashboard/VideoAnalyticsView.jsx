'use strict';
import React, { useState, useEffect, useRef } from 'react';
import { Link }                from 'react-router-dom';
import api                     from '../../lib/api';
import { generateEmbedSnippet } from '../../lib/embed';
import { useToast }            from '../../contexts/ToastContext';
import { ThemeToggle }         from '../../contexts/ThemeContext';
import InsightsSection         from './InsightsSection';
import HeatmapSection          from './HeatmapSection';
import ViewerStoriesSection    from './ViewerStoriesSection';
import NotificationBell        from './NotificationBell';
import MetricDetailView            from './MetricDetailView';
import DevicesSection              from './DevicesSection';
import GeographySection            from './GeographySection';
import BrowsersSection             from './BrowsersSection';
import IndividualViewerSection     from './IndividualViewerSection';
import TrafficSourcesSection       from './TrafficSourcesSection';
import DomainsSection              from './DomainsSection';
import PlanTierBadge, { PlanCrown, getLockColor, PadLockIcon } from '../PlanTierBadge';
import { useUpgrade }          from '../../contexts/UpgradeContext';

/**
 * VideoAnalyticsView
 *
 * Right-panel content area for the per-video dashboard.
 * Renders different sub-views based on `activeView` prop.
 *
 * Props:
 *   video               — video object
 *   user                — user object
 *   activeView          — current view key (string)
 *   onViewChange        — (view: string) => void
 *   animateIn           — boolean (runs reveal animation on first load)
 *   onAnimationComplete — called when reveal animation finishes
 *   onRefresh           — optional refresh callback
 *   isRefreshing        — boolean
 */

// ─────────────────────────────────────────────────────────────────────────
// Animation stage constants (overview reveal)
// ─────────────────────────────────────────────────────────────────────────

const STAGE_DELAYS   = [0, 300, 650, 950, 1250, 1700, 2200];
const COMPLETE_DELAY = 2700;

// ─────────────────────────────────────────────────────────────────────────
// View labels for top bar breadcrumb
// ─────────────────────────────────────────────────────────────────────────

const VIEW_LABELS = {
  overview      : 'Overview',
  total_views   : 'Total Page Views',
  plays         : 'Total Plays',
  unique_views  : 'Unique Page Views',
  total_viewers : 'Total Viewers',
  viewers       : 'Unique Viewers',
  avg_watch     : 'Avg. Watch %',
  play_rate     : 'Play Rate',
  completion    : 'Completion Rate',
  dropoff       : 'Drop-off Rate',
  watch_time    : 'Watch Time',
  rewatches     : 'Re-watches',
  heatmap       : 'Engagement Heatmap',
  stories       : 'Viewer Stories',
  insights      : 'Insights',
  geography     : 'Geography',
  devices       : 'Devices',
  browsers      : 'Browsers',
  traffic       : 'Traffic Sources',
  domains       : 'Domains',
  embed         : 'Share & Embed',
  player        : 'Player Settings',
};

// Metric views that map to the time-series chart
const METRIC_VIEWS = new Set([
  'total_views', 'plays', 'unique_views', 'total_viewers', 'viewers',
  'avg_watch', 'play_rate', 'completion', 'dropoff',
  'watch_time', 'rewatches',
]);

// ─────────────────────────────────────────────────────────────────────────
// Plan rank helpers (shared by MetricCard and plan gates)
// ─────────────────────────────────────────────────────────────────────────

const PLAN_RANK = { free: 0, starter: 1, pro: 2, admin_lifetime: 3 };

// Which plan each overview metric card requires
const CARD_REQUIRED_PLAN = {
  avg_watch  : 'starter',
  completion : 'starter',
  watch_time : 'starter',
  dropoff    : 'pro',
  rewatches  : 'pro',
};

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function fmtSeconds(secs) {
  if (!secs || secs < 0) return '0:00';
  const s = Math.round(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const PLATFORM_LABELS = {
  youtube: 'YouTube', vimeo: 'Vimeo', loom: 'Loom', zoom: 'Zoom',
  google_drive: 'Google Drive', dropbox: 'Dropbox',
  mp4_direct: 'Direct video', hls_stream: 'HLS stream', other: 'Video',
};

function getJudgment(video) {
  const plays    = video?.total_plays    ?? 0;
  const avgWatch = parseFloat(video?.avg_watch_pct ?? 0);
  if (plays === 0)    return { headline: 'Your tracker is live.', detail: 'Share this video and your first insights will appear here automatically once viewers start watching.', colorClass: 'text-gray-300' };
  if (plays < 10)     return { headline: `${plays} play${plays !== 1 ? 's' : ''} so far.`, detail: 'Insights sharpen with more data. Keep sharing to unlock your first analysis.', colorClass: 'text-amber-300' };
  if (avgWatch >= 70) return { headline: 'Exceptional retention.', detail: `Viewers watch ${avgWatch.toFixed(0)}% on average — well above the 40% industry benchmark.`, colorClass: 'text-emerald-300' };
  if (avgWatch >= 50) return { headline: 'Solid retention.', detail: `${avgWatch.toFixed(0)}% average watch time. Check the heatmap to find where engagement dips.`, colorClass: 'text-amber-300' };
  if (avgWatch >= 30) return { headline: 'Room to improve.', detail: `Viewers leave after ${avgWatch.toFixed(0)}% on average. A stronger opening hook could help.`, colorClass: 'text-amber-300' };
  return { headline: 'High drop-off detected.', detail: `Only ${avgWatch.toFixed(0)}% average watch time. Your intro may need rethinking.`, colorClass: 'text-red-300' };
}

// ─────────────────────────────────────────────────────────────────────────
// useCountUp
// ─────────────────────────────────────────────────────────────────────────

function useCountUp(target, duration = 900, shouldStart = true) {
  const [value,    setValue]  = useState(0);
  const rafRef     = useRef(null);
  const startRef   = useRef(null);

  useEffect(() => {
    if (!shouldStart) return;
    if (target === 0) { setValue(0); return; }
    startRef.current = null;
    function tick(ts) {
      if (!startRef.current) startRef.current = ts;
      const elapsed  = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, shouldStart]);

  return value;
}

// ─────────────────────────────────────────────────────────────────────────
// VideoAnalyticsView — main export
// ─────────────────────────────────────────────────────────────────────────

export default function VideoAnalyticsView({
  video,
  user,
  activeView          = 'overview',
  onViewChange        = () => {},
  animateIn           = false,
  onAnimationComplete = null,
  onRefresh           = null,
  isRefreshing        = false,
}) {
  const FULL_STAGE = 99;
  const [stage, setStage] = useState(animateIn ? 0 : FULL_STAGE);

  useEffect(() => {
    if (!animateIn) return;
    const timers  = STAGE_DELAYS.map((delay, idx) =>
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

  const plays    = video?.total_plays    ?? 0;
  const viewers  = video?.unique_viewers ?? 0;
  const avgWatch = parseFloat(video?.avg_watch_pct ?? 0);
  const hasPlays = plays > 0;

  const playRatePct    = parseFloat(video?.play_rate_pct    ?? 0);
  const completedViews = parseInt(video?.completed_views    ?? 0, 10);
  const totalWatchSecs = parseInt(video?.total_watch_seconds_sum ?? 0, 10);
  const totalWatchMins = Math.round(totalWatchSecs / 60);

  const completionRate    = hasPlays ? (completedViews / plays) * 100 : null;
  const dropoffRate       = completionRate !== null ? (100 - completionRate) : null;
  const avgWatchSecs      = hasPlays && totalWatchSecs > 0 ? totalWatchSecs / plays : null;
  const avgWatchPerViewer = viewers > 0 && totalWatchSecs > 0 ? totalWatchSecs / viewers : null;
  const replayCount       = hasPlays ? Math.max(0, plays - viewers) : null;
  const replayRate        = hasPlays ? Math.max(0, (plays - viewers) / plays * 100) : null;

  const viewLabel = VIEW_LABELS[activeView] ?? 'Overview';

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">{video?.title ? video.title.slice(0, 32) + (video.title.length > 32 ? '…' : '') : 'Video'}</span>
          <span className="text-gray-400">/</span>
          <span className="font-semibold text-gray-200">{viewLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NotificationBell />
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-40"
              title="Refresh analytics"
            >
              <RefreshIcon spinning={isRefreshing} />
            </button>
          )}
          <Link
            to="/account"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            title="Settings"
          >
            <SettingsNavIcon />
          </Link>
        </div>
      </div>

      {/* ── Scrollable content ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Metric time-series views ──────────────────────────────── */}
        {METRIC_VIEWS.has(activeView) && (
          <MetricDetailView videoId={video?.id} metric={activeView} video={video} userPlan={user?.plan} />
        )}

        {/* ── Engagement sub-views ─────────────────────────────────── */}
        {activeView === 'heatmap' && (
          <div className="px-6 py-6 flex flex-col gap-10">
            {/* Viewer Retention Curve */}
            <div>
              <div className="mb-5">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
                  Engagement
                </p>
                <h2 className="text-2xl font-bold text-gray-50 flex items-center gap-2">Viewer Retention <PlanTierBadge plan="pro" userPlan={user?.plan} /></h2>
                <p className="text-xs text-gray-400 mt-1">
                  Percentage of viewers still watching at each point in the video.
                </p>
              </div>
              <HeatmapSection videoId={video?.id} video={video} userPlan={user?.plan} />
            </div>

            {/* Individual Viewer Engagement */}
            <div>
              <IndividualViewerSection videoId={video?.id} userPlan={user?.plan} />
            </div>
          </div>
        )}

        {activeView === 'stories' && (
          <div className="px-6 py-6">
            <div className="mb-5">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
                Engagement
              </p>
              <h2 className="text-2xl font-bold text-gray-50 flex items-center gap-2">Viewer Stories <PlanTierBadge plan="starter" userPlan={user?.plan} /></h2>
              <p className="text-xs text-gray-400 mt-1">
                AI-generated narratives about how your audience watched this video.
              </p>
            </div>
            <ViewerStoriesSection videoId={video?.id} userPlan={user?.plan} />
          </div>
        )}

        {activeView === 'insights' && (
          <div className="px-6 py-6">
            <div className="mb-5">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
                Engagement
              </p>
              <h2 className="text-2xl font-bold text-gray-50 flex items-center gap-2">Insights <PlanTierBadge plan="pro" userPlan={user?.plan} /></h2>
              <p className="text-xs text-gray-400 mt-1">
                Actionable recommendations generated from your audience data.
              </p>
            </div>
            <InsightsSection
              videoId={video?.id}
              insightStatus={video?.insight_status}
              userPlan={user?.plan}
            />
          </div>
        )}

        {/* ── Audience sub-views ───────────────────────────────────── */}
        {activeView === 'geography' && <GeographySection      videoId={video?.id} userPlan={user?.plan} />}
        {activeView === 'devices'   && <DevicesSection         videoId={video?.id} userPlan={user?.plan} />}
        {activeView === 'browsers'  && <BrowsersSection        videoId={video?.id} userPlan={user?.plan} />}
        {activeView === 'traffic'   && <TrafficSourcesSection  videoId={video?.id} userPlan={user?.plan} />}
        {activeView === 'domains'   && <DomainsSection         videoId={video?.id} />}

        {/* ── Embed view ───────────────────────────────────────────── */}
        {activeView === 'embed' && (
          <EmbedView video={video} user={user} />
        )}

        {/* ── Player settings view ─────────────────────────────────── */}
        {activeView === 'player' && (
          <PlayerSettingsView videoId={video?.id} />
        )}

        {/* ── Overview ─────────────────────────────────────────────── */}
        {activeView === 'overview' && (
          <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">

            {/* Video title */}
            <div
              className={`mb-7 transition-all duration-500
                          ${stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-50 leading-tight">
                {video?.title ?? 'Untitled Video'}
              </h1>
              <p className="text-sm text-gray-400 mt-1.5 flex items-center gap-2">
                <span>{PLATFORM_LABELS[video?.source_type] ?? 'Video'}</span>
                <span className="text-gray-400">·</span>
                <span>
                  Added {video?.created_at
                    ? new Date(video.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </span>
              </p>
            </div>

            {/* Metric cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              <MetricCard label="Total Plays"        value={plays}          format={n => n.toLocaleString()}                              visible={stage >= 3} accent="amber"   onClick={() => onViewChange('plays')} userPlan={user?.plan} subtitle="times this video was played" />
              <MetricCard label="Unique Viewers"     value={viewers}        format={n => n.toLocaleString()}                              visible={stage >= 4} accent="indigo"  onClick={() => onViewChange('viewers')} userPlan={user?.plan} subtitle="individual viewers" />
              <MetricCard label="Avg. Watch"         value={hasPlays ? avgWatch : null}   format={n => `${n.toFixed(0)}%`}              visible={stage >= 5} accent="emerald" className="col-span-2 sm:col-span-1" onClick={() => onViewChange('avg_watch')} requiredPlan={CARD_REQUIRED_PLAN.avg_watch} userPlan={user?.plan} subtitle="of video watched on average" />
              <MetricCard label="Completion Rate"    value={completionRate} format={n => `${n.toFixed(0)}%`}                             visible={stage >= 5} accent="teal"    onClick={() => onViewChange('completion')} requiredPlan={CARD_REQUIRED_PLAN.completion} userPlan={user?.plan} subtitle="viewers watched to completion" />
              <MetricCard label="Play Rate"          value={hasPlays ? playRatePct : null} format={n => `${n.toFixed(0)}%`}             visible={stage >= 5} accent="violet"  onClick={() => onViewChange('play_rate')} userPlan={user?.plan} subtitle="of page loads result in play" />
              <MetricCard label="Drop-off Rate"      value={dropoffRate}    format={n => `${n.toFixed(0)}%`}                             visible={stage >= 5} accent="rose"    onClick={() => onViewChange('dropoff')} requiredPlan={CARD_REQUIRED_PLAN.dropoff} userPlan={user?.plan} subtitle="leave in the first 30 seconds" />
              <MetricCard label="Total Watch Time"   value={hasPlays ? totalWatchMins : null} format={n => n >= 60 ? `${(n/60).toFixed(1)} hr` : `${n} min`} visible={stage >= 5} accent="sky" className="col-span-2 sm:col-span-1" onClick={() => onViewChange('watch_time')} requiredPlan={CARD_REQUIRED_PLAN.watch_time} userPlan={user?.plan} subtitle="total watch time across all plays" />
              <MetricCard label="Avg. Duration/View" value={avgWatchSecs}   format={n => fmtSeconds(n)}                                  visible={stage >= 5} accent="orange"  className="col-span-2 sm:col-span-1" onClick={() => onViewChange('avg_watch')} requiredPlan={CARD_REQUIRED_PLAN.avg_watch} userPlan={user?.plan} subtitle="average time per viewing session" />
              <MetricCard label="Avg. Watch/Viewer"  value={avgWatchPerViewer} format={n => fmtSeconds(n)}                               visible={stage >= 5} accent="purple"  className="col-span-2 sm:col-span-1" onClick={() => onViewChange('avg_watch')} requiredPlan={CARD_REQUIRED_PLAN.avg_watch} userPlan={user?.plan} subtitle="average watch time per viewer" />
              <MetricCard label="Completions"        value={hasPlays ? completedViews : null} format={n => n.toLocaleString()}           visible={stage >= 5} accent="pink"    onClick={() => onViewChange('completion')} requiredPlan={CARD_REQUIRED_PLAN.completion} userPlan={user?.plan} subtitle="views watched all the way through" />
              <MetricCard label="Re-watches"         value={replayCount}    format={n => n.toLocaleString()}                              visible={stage >= 5} accent="yellow"  onClick={() => onViewChange('rewatches')} requiredPlan={CARD_REQUIRED_PLAN.rewatches} userPlan={user?.plan} subtitle="times viewers replayed this video" />
              <MetricCard label="Replay Rate"        value={replayRate}     format={n => `${n.toFixed(0)}%`}                             visible={stage >= 5} accent="amber"   className="col-span-2 sm:col-span-1" onClick={() => onViewChange('rewatches')} requiredPlan={CARD_REQUIRED_PLAN.rewatches} userPlan={user?.plan} subtitle="of viewers replayed the video" />
            </div>

            {/* Judgment text */}
            <div
              className={`mb-8 transition-all duration-500
                          ${stage >= 6 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
            >
              {(() => {
                const j = getJudgment(video);
                return (
                  <>
                    <p className={`text-lg font-semibold mb-1 ${j.colorClass}`}>{j.headline}</p>
                    <p className="text-sm text-gray-300 max-w-xl leading-relaxed">{j.detail}</p>
                  </>
                );
              })()}
            </div>

            {/* Action bar */}
            <div
              className={`transition-all duration-500
                          ${stage >= 7 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
            >
              <ActionBar video={video} onEmbedView={() => onViewChange('embed')} />
            </div>

            {/* Analytics sections */}
            {stage >= 7 && (
              <div className="mt-10 flex flex-col gap-10">
                <div className="h-px bg-gray-800" />

                {/* Insights */}
                <InsightsSection
                  videoId={video?.id}
                  insightStatus={video?.insight_status}
                  userPlan={user?.plan}
                />

                {/* Heatmap — clickable header navigates to dedicated view */}
                <div>
                  <button
                    onClick={() => onViewChange('heatmap')}
                    className="flex items-center gap-2 mb-4 group w-full text-left"
                  >
                    <span className="text-amber-500 text-sm">〰</span>
                    <h2 className="text-base font-semibold text-gray-200 group-hover:text-gray-100 transition-colors">
                      Engagement Heatmap
                    </h2>
                    <span className="ml-auto text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                      View full →
                    </span>
                  </button>
                  <HeatmapSection videoId={video?.id} video={video} userPlan={user?.plan} />
                </div>

                {/* Individual Viewer Engagement */}
                <IndividualViewerSection videoId={video?.id} userPlan={user?.plan} />

                {/* Viewer Stories */}
                <ViewerStoriesSection videoId={video?.id} userPlan={user?.plan} />

                <div className="h-px bg-gray-800" />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MetricCard — stat card with count-up + click navigation
// ─────────────────────────────────────────────────────────────────────────

function MetricCard({ label, value, format, visible, accent, className = '', onClick, requiredPlan, userPlan, subtitle }) {
  const numericValue = typeof value === 'number' ? value : 0;
  const counted      = useCountUp(numericValue, 900, visible && value !== null);
  const isNull       = value === null;
  const { showUpgrade } = useUpgrade();

  const locked = requiredPlan && (PLAN_RANK[userPlan] ?? 0) < (PLAN_RANK[requiredPlan] ?? 0);

  function handleClick() {
    if (locked) { showUpgrade(requiredPlan); return; }
    onClick?.();
  }

  const accentMap = {
    amber  : 'border-t-amber-500/70',
    indigo : 'border-t-indigo-500/70',
    emerald: 'border-t-emerald-500/70',
    teal   : 'border-t-teal-500/70',
    violet : 'border-t-violet-500/70',
    rose   : 'border-t-rose-500/70',
    sky    : 'border-t-sky-500/70',
    orange : 'border-t-orange-500/70',
    purple : 'border-t-purple-500/70',
    pink   : 'border-t-pink-500/70',
    yellow : 'border-t-yellow-500/70',
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-gray-800 border border-gray-700/80 border-t-2 ${accentMap[accent] ?? accentMap.amber}
                  rounded-xl px-4 py-4 text-left transition-all duration-500 group
                  hover:border-gray-600 hover:bg-gray-700/80 active:scale-[0.98]
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                  ${className}`}
    >
      <p className="text-[11px] text-gray-300 uppercase tracking-wider font-semibold mb-2 leading-tight flex items-center gap-1.5">
        <span className="flex-1 truncate">{label}</span>
      </p>
      <p className="text-3xl font-bold text-gray-50 tabular-nums">
        {isNull
          ? <span className="text-gray-400">—</span>
          : format(counted)
        }
      </p>
      <p className="text-[10px] mt-1.5 leading-snug">
        {locked
          ? <span className="font-medium inline-flex items-center gap-1" style={{ color: getLockColor(requiredPlan) }}>
              <PadLockIcon size={9} color={getLockColor(requiredPlan)} />
              Upgrade to {requiredPlan} →
            </span>
          : <span className="text-gray-400">{subtitle ?? 'View details →'}</span>
        }
      </p>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ActionBar — copy link + embed code
// ─────────────────────────────────────────────────────────────────────────

function ActionBar({ video, onEmbedView }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = video?.original_url ?? '';
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(() => {});
  }

  return (
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
        onClick={onEmbedView}
        className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20
                   border border-amber-500/30 text-sm text-amber-300 font-medium
                   rounded-lg transition-colors"
      >
        <CodeIcon />
        Get embed code
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EmbedView — full embed code panel
// ─────────────────────────────────────────────────────────────────────────


function EmbedView({ video, user }) {
  const { showToast } = useToast();

  const [linkCopied,    setLinkCopied]    = useState(false);
  const [embedCopied,   setEmbedCopied]   = useState(false);

  const origin  = typeof window !== 'undefined' ? window.location.origin : '';
  const snippet = generateEmbedSnippet(video?.id ?? '', origin);

  function copyLink() {
    navigator.clipboard.writeText(video?.original_url ?? '')
      .then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); })
      .catch(() => {});
  }
  function copyEmbed() {
    navigator.clipboard.writeText(snippet)
      .then(() => { setEmbedCopied(true); setTimeout(() => setEmbedCopied(false), 3000); })
      .catch(() => {});
  }
  return (
    <div className="px-6 py-6 min-w-0">
      <div className="mb-6">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
          Settings
        </p>
        <h2 className="text-2xl font-bold text-gray-50">Share & Embed</h2>
        <p className="text-xs text-gray-400 mt-1">
          Copy the video link or embed the tracked player on any website.
        </p>
      </div>

      <div className="flex flex-col gap-5 max-w-2xl">
        {/* Copy link */}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-200 mb-1">Video link</p>
          <p className="text-xs text-gray-400 mb-3">Share the original video URL directly.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 truncate font-mono">
              {video?.original_url ?? '—'}
            </code>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600
                         border border-gray-600 text-xs text-gray-200 font-medium rounded-lg transition-colors flex-shrink-0"
            >
              {linkCopied ? <CheckSmallIcon className="text-emerald-400" /> : <CopyIcon />}
              {linkCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Embed code */}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-200 mb-1">Embed code</p>
          <p className="text-xs text-gray-400 mb-3">
            Paste this on any page. Plays, watch time, and heatmap data appear in this dashboard automatically.
          </p>
          <div className="relative">
            <pre className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-xs text-gray-300 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
              {snippet}
            </pre>
          </div>
          <button
            onClick={copyEmbed}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400
                       text-gray-900 text-sm font-semibold rounded-lg transition-colors"
          >
            {embedCopied
              ? <><CheckSmallIcon className="text-gray-900" /> Copied!</>
              : <><CopyIcon /> Copy embed code</>
            }
          </button>
        </div>

        {/* CTA Tracking note */}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-200 mb-1">CTA Tracking Links</p>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            Create named tracking links for your CTA buttons. Use them as button URLs to log every
            click in your Events log — no code needed.
          </p>
          <a
            href="/cta-tracking"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20
                       border border-amber-500/20 text-amber-400 text-xs font-semibold
                       rounded-lg transition-colors"
          >
            Go to CTA Tracking →
          </a>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PlayerSettingsView — full player settings panel
// ─────────────────────────────────────────────────────────────────────────

const PLAYER_DEFAULTS = {
  autoplay: false, autoplay_muted: true, start_muted: true,
  show_seek_bar: true, show_play_pause_btn: true, show_playback_speed: true,
  show_fullscreen_btn: true, show_volume_control: true,
  show_rewind_forward: true,
  resume_playback: false, loop: false,
};

const PLAYER_ROWS = [
  { key: 'autoplay',            label: 'Autoplay',            desc: 'Start playing when the page loads' },
  { key: 'start_muted',         label: 'Start Muted',         desc: 'Begin playback muted; viewers can unmute' },
  { key: 'show_play_pause_btn', label: 'Play / Pause Button', desc: 'Show the play and pause button in the control bar' },
  { key: 'show_seek_bar',       label: 'Seek Bar',            desc: 'Allow viewers to scrub through the video' },
  { key: 'show_volume_control', label: 'Volume Control',      desc: 'Show volume slider and mute toggle' },
  { key: 'show_playback_speed', label: 'Playback Speed',      desc: 'Let viewers choose 0.5×, 1×, 1.25×, 1.5×, 2×' },
  { key: 'show_fullscreen_btn', label: 'Fullscreen Button',   desc: 'Show the fullscreen toggle' },
  { key: 'show_rewind_forward', label: 'Rewind / Forward',    desc: 'Show ↺10s and 10↻s skip buttons in the center overlay' },
  { key: 'resume_playback',     label: 'Resume Playback',     desc: 'Prompt viewers to resume or restart when they return to the video' },
  { key: 'loop',                label: 'Loop',                desc: 'Replay the video automatically when it ends' },
];

function PlayerSettingsView({ videoId }) {
  const { showToast } = useToast();
  const [settings, setSettings] = useState(null);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (!videoId) return;
    api.get(`/videos/${videoId}/player-settings`)
      .then(r => setSettings(r.data.settings))
      .catch(() => setSettings({ ...PLAYER_DEFAULTS }));
  }, [videoId]);

  async function toggle(key) {
    const prev = { ...settings };
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSaving(true);
    try {
      const { data } = await api.patch(`/videos/${videoId}/player-settings`, next);
      setSettings(data.settings);
      showToast('Player settings saved');
    } catch (err) {
      setSettings(prev);
      showToast(err.response?.data?.message ?? 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-6 py-6 min-w-0">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
            Settings
          </p>
          <h2 className="text-2xl font-bold text-gray-50">Player Settings</h2>
          <p className="text-xs text-gray-400 mt-1">
            Control how the embedded player looks and behaves.
          </p>
        </div>
        {saving && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <span className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Saving…
          </div>
        )}
      </div>

      <div className="max-w-2xl bg-gray-800/40 border border-gray-700/50 rounded-xl divide-y divide-gray-700/40">
        {settings === null ? (
          <div className="px-5 py-6 flex items-center gap-2 text-gray-500 text-sm">
            <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Loading settings…
          </div>
        ) : (
          PLAYER_ROWS.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-gray-200">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative inline-flex flex-shrink-0 h-5 w-9 rounded-full transition-colors duration-200 ml-4
                  ${settings[key] ? 'bg-amber-500' : 'bg-gray-600'}`}
                role="switch"
                aria-checked={settings[key]}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5
                    ${settings[key] ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckSmallIcon({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function RefreshIcon({ spinning = false }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={spinning ? { animation: 'vpSpin 0.8s linear infinite' } : undefined}
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      {spinning && (
        <style>{`@keyframes vpSpin{from{transform-origin:center;transform:rotate(0deg)}to{transform-origin:center;transform:rotate(360deg)}}`}</style>
      )}
    </svg>
  );
}

function SettingsNavIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}
