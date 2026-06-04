import React, { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { FeatureWall } from '../upgrade';
import PlanTierBadge from '../PlanTierBadge';

/**
 * InsightsSection
 *
 * Renders all AI-generated insights for a video.
 * - Primary insight (is_primary=true) → prominent card with full detail
 * - Secondary insights → compact list below
 *
 * Plan gating: insight body + action_prompt are blurred behind a FeatureWall
 * for insight types that require a higher plan than the user currently has.
 *
 * Props:
 *   videoId       — UUID of the video
 *   insightStatus — 'pending' | 'generating' | 'complete' | 'failed'
 *   userPlan      — 'free' | 'starter' | 'pro' | 'admin_lifetime'
 */

// ── Plan gate mapping ─────────────────────────────────────────────────────
// insight_type → feature key (matches planGate.js FEATURE_PLAN_REQUIREMENTS)
const INSIGHT_FEATURE_MAP = {
  drop_off_moment    : 'heatmap',
  engagement_spike   : 'heatmap',
  dead_zone          : 'heatmap',
  returning_viewers  : 'viewer_level',
  utm_top_source     : 'audience_segmentation',
  funnel_drop        : 'conversion_tracking',
  cta_performance    : 'conversion_tracking',
  mobile_gap         : 'device_breakdown',
  mobile_drop        : 'device_breakdown',
  geography_surprise : 'geography',
  // Free-tier insights — no gate
  play_rate_low      : null,
  play_rate_high     : null,
  low_play_rate      : null,
  completion_champion: null,
  strong_opener      : null,
};

const FEATURE_REQUIRED_PLAN = {
  heatmap              : 'pro',
  viewer_level         : 'pro',
  audience_segmentation: 'pro',
  conversion_tracking  : 'pro',
  events               : 'pro',
  device_breakdown     : 'starter',
  geography            : 'starter',
};

const PLAN_RANK = { free: 0, starter: 1, pro: 2, admin_lifetime: 99 };

function getInsightGate(insightType, userPlan) {
  const feature      = INSIGHT_FEATURE_MAP[insightType] ?? null;
  if (!feature) return { locked: false, feature: null, requiredPlan: null };
  const requiredPlan = FEATURE_REQUIRED_PLAN[feature] ?? null;
  if (!requiredPlan) return { locked: false, feature, requiredPlan: null };
  const userRank     = PLAN_RANK[userPlan] ?? 0;
  const locked       = userRank < (PLAN_RANK[requiredPlan] ?? 99);
  return { locked, feature, requiredPlan };
}

// ── Severity styles ───────────────────────────────────────────────────────
const SEVERITY = {
  critical   : { border: 'border-l-red-500',    badge: 'bg-red-500/10 text-red-300 border-red-500/30',    dot: 'bg-red-500',    label: 'Critical'    },
  warning    : { border: 'border-l-orange-500',  badge: 'bg-orange-500/10 text-orange-300 border-orange-500/30', dot: 'bg-orange-500', label: 'Warning' },
  opportunity: { border: 'border-l-amber-500',   badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',    dot: 'bg-amber-500',  label: 'Opportunity' },
  info       : { border: 'border-l-indigo-500',  badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30', dot: 'bg-indigo-500', label: 'Insight'  },
};

// ── Insight type display labels ───────────────────────────────────────────
const INSIGHT_TYPE_LABELS = {
  drop_off_moment    : 'Drop-off',
  engagement_spike   : 'Engagement spike',
  dead_zone          : 'Dead zone',
  play_rate_low      : 'Play rate',
  play_rate_high     : 'Play rate',
  low_play_rate      : 'Play rate',
  completion_champion: 'Completion',
  strong_opener      : 'Strong opener',
  mobile_gap         : 'Mobile',
  mobile_drop        : 'Mobile',
  geography_surprise : 'Geography',
  returning_viewers  : 'Returning viewers',
  utm_top_source     : 'Traffic source',
  funnel_drop        : 'Funnel',
  cta_performance    : 'CTA',
};

// ─────────────────────────────────────────────────────────────────────────

export default function InsightsSection({ videoId, insightStatus, userPlan }) {
  const [insights, setInsights] = useState(null);
  const [loading,  setLoading]  = useState(true);

  const fetchInsights = useCallback(() => {
    if (!videoId) return;
    setLoading(true);
    api.get(`/videos/${videoId}/insights`)
      .then(res => setInsights(res.data.insights ?? []))
      .catch(() => setInsights([]))
      .finally(() => setLoading(false));
  }, [videoId]);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  function handleDismiss(insightId) {
    api.patch(`/videos/${videoId}/insights/${insightId}/dismiss`)
      .then(() => setInsights(prev => prev?.filter(i => i.id !== insightId) ?? []))
      .catch(() => {}); // Silently ignore — UI already updated
  }

  const primary   = insights?.find(i => i.is_primary) ?? null;
  const secondary = insights?.filter(i => !i.is_primary) ?? [];

  const isPro = (PLAN_RANK[userPlan] ?? 0) >= PLAN_RANK['pro'];

  // ── Section header ──────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <SparklesIcon className="text-amber-500" />
        <h2 className="text-base font-semibold text-gray-200 flex items-center gap-2">AI Insights <PlanTierBadge plan="pro" userPlan={userPlan} /></h2>
        {insights !== null && insights.length > 0 && (
          <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-300 rounded-full border border-amber-500/20">
            {insights.length}
          </span>
        )}
      </div>

      {/* ── Pro feature wall — non-pro users see blurred placeholder ───── */}
      {!isPro ? (
        <FeatureWall
          feature="insights"
          requiredPlan="pro"
          currentPlan={userPlan}
          minHeight="220px"
        >
          <InsightsSkeleton />
        </FeatureWall>
      ) : (
        <>
          {/* ── Loading ─────────────────────────────────────────────── */}
          {loading && <InsightsSkeleton />}

          {/* ── Waiting for data ────────────────────────────────────── */}
          {!loading && (insightStatus === 'pending' || insightStatus === 'generating') && (
            <InsightsPending />
          )}

          {/* ── No insights (complete but empty) ───────────────────── */}
          {!loading && insightStatus === 'complete' && insights?.length === 0 && (
            <InsightsEmpty />
          )}

          {/* ── Failed ─────────────────────────────────────────────── */}
          {!loading && insightStatus === 'failed' && (
            <InsightsFailed onRetry={fetchInsights} />
          )}

          {/* ── Insights available ─────────────────────────────────── */}
          {!loading && insights && insights.length > 0 && (
            <div className="flex flex-col gap-3">
              {primary && (
                <PrimaryInsightCard
                  insight={primary}
                  userPlan={userPlan}
                  onDismiss={() => handleDismiss(primary.id)}
                />
              )}
              {secondary.length > 0 && (
                <SecondaryInsightsList
                  insights={secondary}
                  userPlan={userPlan}
                  onDismiss={handleDismiss}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PrimaryInsightCard — the "wow moment" card
// ─────────────────────────────────────────────────────────────────────────

function PrimaryInsightCard({ insight, userPlan, onDismiss }) {
  const { locked, feature, requiredPlan } = getInsightGate(insight.insight_type, userPlan);
  const sev       = SEVERITY[insight.severity] ?? SEVERITY.info;
  const typeLabel = INSIGHT_TYPE_LABELS[insight.insight_type] ?? insight.insight_type;
  const timeLabel = insight.timestamp_seconds ? formatTime(insight.timestamp_seconds) : null;

  return (
    <div className={`bg-gray-800 border border-gray-700 border-l-4 ${sev.border} rounded-xl overflow-hidden`}>

      {/* ── Card header ─────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
              Primary Insight
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-full ${sev.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
              {sev.label}
            </span>
            <span className="hidden sm:inline px-2 py-0.5 text-xs text-gray-400 bg-gray-700/50 rounded-full">
              {typeLabel}
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-400 transition-colors p-1 rounded-md hover:bg-gray-700/50 flex-shrink-0"
            aria-label="Dismiss insight"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Headline */}
        <h3 className="text-xl sm:text-2xl font-bold text-gray-50 leading-snug mb-2">
          {insight.headline}
        </h3>

        {/* Timestamp pill — for second-specific insights */}
        {timeLabel && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-300 text-xs font-medium rounded-full border border-amber-500/20">
            <ClockIcon />
            at {timeLabel}
          </span>
        )}

        {/* Metric pill — optional */}
        {insight.metric_value !== null && insight.metric_label && !locked && (
          <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 bg-gray-700/60 text-gray-300 text-xs font-medium rounded-full">
            {formatMetric(insight.metric_value)} {insight.metric_label}
          </span>
        )}
      </div>

      {/* ── Card body — plan-gated ───────────────────────────────────── */}
      {locked ? (
        <FeatureWall
          feature={feature}
          requiredPlan={requiredPlan}
          currentPlan={userPlan}
          minHeight="130px"
        >
          <InsightBody body={insight.body} actionPrompt={insight.action_prompt} />
        </FeatureWall>
      ) : (
        <InsightBody body={insight.body} actionPrompt={insight.action_prompt} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// InsightBody — shared by gated + unlocked insight cards
// ─────────────────────────────────────────────────────────────────────────

function InsightBody({ body, actionPrompt }) {
  return (
    <div className="px-5 pb-5">
      <p className="text-sm text-gray-300 leading-relaxed mb-4">{body}</p>
      <div className="bg-gray-900/60 border border-gray-700/50 rounded-lg px-4 py-3">
        <p className="text-xs text-amber-400 font-semibold uppercase tracking-wide mb-1.5">
          What to do
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">{actionPrompt}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SecondaryInsightsList — compact rows for non-primary insights
// ─────────────────────────────────────────────────────────────────────────

function SecondaryInsightsList({ insights, userPlan, onDismiss }) {
  return (
    <div className="flex flex-col gap-2">
      {insights.map(insight => (
        <SecondaryInsightRow
          key={insight.id}
          insight={insight}
          userPlan={userPlan}
          onDismiss={() => onDismiss(insight.id)}
        />
      ))}
    </div>
  );
}

function SecondaryInsightRow({ insight, userPlan, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  const { locked, feature, requiredPlan } = getInsightGate(insight.insight_type, userPlan);
  const sev       = SEVERITY[insight.severity] ?? SEVERITY.info;
  const typeLabel = INSIGHT_TYPE_LABELS[insight.insight_type] ?? insight.insight_type;
  const timeLabel = insight.timestamp_seconds ? formatTime(insight.timestamp_seconds) : null;

  return (
    <div className={`bg-gray-800/60 border border-gray-700 border-l-2 ${sev.border} rounded-xl overflow-hidden`}>
      {/* Row header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700/20 transition-colors"
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sev.dot}`} />
        <span className="flex-1 text-sm font-medium text-gray-200 truncate">
          {insight.headline}
        </span>
        {timeLabel && (
          <span className="hidden sm:flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
            <ClockIcon size={10} />
            {timeLabel}
          </span>
        )}
        <span className="text-xs text-gray-400 flex-shrink-0">{typeLabel}</span>
        <ChevronIcon expanded={expanded} />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-700/50">
          {locked ? (
            <FeatureWall
              feature={feature}
              requiredPlan={requiredPlan}
              currentPlan={userPlan}
              minHeight="100px"
            >
              <InsightBody body={insight.body} actionPrompt={insight.action_prompt} />
            </FeatureWall>
          ) : (
            <>
              <InsightBody body={insight.body} actionPrompt={insight.action_prompt} />
              <div className="px-5 pb-3 flex justify-end">
                <button
                  onClick={onDismiss}
                  className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Empty / loading / pending / failed states
// ─────────────────────────────────────────────────────────────────────────

function InsightsSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="h-40 bg-gray-800 border border-gray-700 rounded-xl" />
      <div className="h-12 bg-gray-800/50 border border-gray-700/50 rounded-xl" />
    </div>
  );
}

function InsightsPending() {
  return (
    <div className="bg-gray-800/40 border border-gray-700/50 border-dashed rounded-xl px-5 py-8">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <HourglassIcon className="text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-300 mb-1">
            Insights are on their way
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your first AI-generated insights will appear here automatically once 5 or more
            viewers have watched your video. Share it to speed things up.
          </p>
        </div>
      </div>
    </div>
  );
}

function InsightsEmpty() {
  return (
    <div className="bg-gray-800/40 border border-gray-700/50 border-dashed rounded-xl px-5 py-7 text-center">
      <p className="text-sm text-gray-500">
        No insights yet — we need a bit more viewing data to generate meaningful analysis.
      </p>
    </div>
  );
}

function InsightsFailed({ onRetry }) {
  return (
    <div className="bg-red-900/10 border border-red-700/30 rounded-xl px-5 py-5 flex items-center justify-between gap-4">
      <p className="text-sm text-red-300">Insight generation encountered an error.</p>
      <button
        onClick={onRetry}
        className="text-xs text-amber-400 hover:text-amber-300 font-medium flex-shrink-0"
      >
        Retry
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatMetric(value) {
  if (value === null || value === undefined) return '—';
  const n = parseFloat(value);
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(1);
}

// ── Inline SVG icons ─────────────────────────────────────────────────────

function SparklesIcon({ className = '' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3l1.88 5.76L20 10l-6.12 1.24L12 17l-1.88-5.76L4 10l6.12-1.24L12 3z" />
      <path d="M5 20l.94 2.88L8.82 24l-2.88.12L5 27l-.94-2.88L1.18 24l2.88-.12L5 20z" opacity="0.6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ClockIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function HourglassIcon({ className = '' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
  );
}

function ChevronIcon({ expanded }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 flex-shrink-0 text-gray-500 ${expanded ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
