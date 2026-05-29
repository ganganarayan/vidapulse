import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export default function OverviewPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
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
    if (!secs) return '0m';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  function fmtSeconds(s) {
    if (!s) return '0s';
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem ? `${m}m ${rem}s` : `${m}m`;
  }

  const hasData = data && data.total_videos > 0;

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
          <LoadingSkeleton />
        ) : (!hasData && promoVideos.length === 0) ? (
          <EmptyOverview />
        ) : (
          <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">

            {/* ── Featured / promotion videos ─────────────────────── */}
            {promoVideos.length > 0 && (
              <div>
                <SectionLabel icon="★" text="Featured" color="amber" />
                <div className="flex flex-col gap-2 mt-3">
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

            {/* ── Metric tiles ────────────────────────────────────── */}
            {hasData && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <StatTile
                    label="Total Plays"
                    value={(data.total_plays ?? 0).toLocaleString()}
                    trend={data.trends?.total_plays}
                    icon={<PlayIcon />}
                    iconColor="text-amber-400"
                    iconBg="bg-amber-400/10"
                  />
                  <StatTile
                    label="Play Rate"
                    value={`${(data.play_rate_pct ?? 0).toFixed(1)}%`}
                    trend={data.trends?.play_rate_pct}
                    icon={<TrendingIcon />}
                    iconColor="text-emerald-400"
                    iconBg="bg-emerald-400/10"
                  />
                  <StatTile
                    label="Avg. Time Watched"
                    value={fmtSeconds(data.avg_watch_seconds ?? 0)}
                    trend={data.trends?.avg_watch_seconds}
                    icon={<ClockIcon />}
                    iconColor="text-orange-400"
                    iconBg="bg-orange-400/10"
                  />
                  <StatTile
                    label="Avg. % Watched"
                    value={`${(data.avg_watch_pct ?? 0).toFixed(1)}%`}
                    trend={data.trends?.avg_watch_pct}
                    icon={<EyeIcon />}
                    iconColor="text-purple-400"
                    iconBg="bg-purple-400/10"
                  />
                  <StatTile
                    label="Unique Viewers"
                    value={(data.unique_viewers ?? 0).toLocaleString()}
                    trend={data.trends?.unique_viewers}
                    icon={<UsersIcon />}
                    iconColor="text-sky-400"
                    iconBg="bg-sky-400/10"
                    span2={true}
                  />
                </div>

                {/* ── Heatmap + Geography row ──────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                  {/* Engagement heatmap */}
                  <div className="lg:col-span-2 bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-bold text-gray-200">Engagement Heatmap</h2>
                      <span className="text-xs text-gray-500">Audience retention</span>
                    </div>
                    {data.retention_curve && data.retention_curve.length > 0 ? (
                      <RetentionChart data={data.retention_curve} />
                    ) : (
                      <div className="flex items-center justify-center h-36 text-xs text-gray-600">
                        Not enough play data yet
                      </div>
                    )}
                  </div>

                  {/* Geographic views */}
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
                    <h2 className="text-sm font-bold text-gray-200 mb-4">Geographic Views</h2>
                    {data.top_countries && data.top_countries.length > 0 ? (
                      <GeoList countries={data.top_countries} />
                    ) : (
                      <div className="flex items-center justify-center h-36 text-xs text-gray-600">
                        No location data yet
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Watch time strip ─────────────────────────────── */}
                {data.total_watch_seconds > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <ClockIcon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-400 tabular-nums">
                        {fmtWatchTime(data.total_watch_seconds)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        total watch time across {data.total_videos} {data.total_videos === 1 ? 'video' : 'videos'} · last 30 days
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Top videos ─────────────────────────────────── */}
                {data.top_videos?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <SectionLabel text="Top Videos" />
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

            {/* ── Explore tiles ───────────────────────────────────── */}
            <div>
              <SectionLabel text="Explore" className="mb-3" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { to: '/events',  label: 'Events',  desc: 'Live event stream',  icon: '📋' },
                  { to: '/funnels', label: 'Funnels', desc: 'Viewer journey',     icon: '▽'  },
                  { to: '/reports', label: 'Reports', desc: 'Export & schedule',  icon: '📄' },
                  { to: '/alerts',  label: 'Alerts',  desc: 'Notification rules', icon: '🔔' },
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
// StatTile — beautiful metric card with trend arrow
// ─────────────────────────────────────────────────────────────────────────

function StatTile({ label, value, trend, icon, iconColor, iconBg, span2 }) {
  const trendUp   = trend !== null && trend > 0;
  const trendDown = trend !== null && trend < 0;
  const trendFlat = trend !== null && trend === 0;

  return (
    <div className={`bg-gray-800/50 border border-gray-700/40 rounded-2xl p-4 flex flex-col gap-3
                     hover:border-gray-600/60 transition-colors
                     ${span2 ? 'sm:col-span-1 col-span-2 lg:col-span-1' : ''}`}>
      {/* Icon + label */}
      <div className="flex items-center gap-2">
        <span className={`w-6 h-6 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <span className={`w-3.5 h-3.5 ${iconColor}`}>{icon}</span>
        </span>
        <span className="text-[11px] font-semibold text-gray-400 truncate">{label}</span>
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-gray-50 tabular-nums leading-none">{value}</p>

      {/* Trend */}
      <div className="flex items-center gap-1">
        {trendUp && (
          <>
            <ArrowUpIcon className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-emerald-400">+{Math.abs(trend)}%</span>
          </>
        )}
        {trendDown && (
          <>
            <ArrowDownIcon className="w-3 h-3 text-red-400 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-red-400">{trend}%</span>
          </>
        )}
        {trendFlat && (
          <span className="text-[11px] font-semibold text-gray-500">0%</span>
        )}
        {trend === null && (
          <span className="text-[11px] text-gray-600">—</span>
        )}
        <span className="text-[10px] text-gray-600 ml-0.5">vs prev 30d</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// RetentionChart — SVG audience-retention line chart
// ─────────────────────────────────────────────────────────────────────────

function RetentionChart({ data }) {
  const W = 560;
  const H = 150;
  const padL = 32;
  const padR = 12;
  const padT = 10;
  const padB = 20;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const yScale = v  => padT + chartH * (1 - v / 100);
  const xScale = p  => padL + chartW * (p / 100);

  // Build path including extrapolated 100% endpoint
  const pts = [...data];
  if (pts[pts.length - 1]?.pct < 100) {
    pts.push({ pct: 100, viewers_pct: pts[pts.length - 1].viewers_pct });
  }
  const pathPts = pts.map(d => ({ x: xScale(d.pct), y: yScale(d.viewers_pct) }));
  const linePath = pathPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${pathPts[pathPts.length - 1].x.toFixed(1)},${(padT + chartH).toFixed(1)} L${pathPts[0].x.toFixed(1)},${(padT + chartH).toFixed(1)} Z`;

  const gridYs = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '150px' }}>
      <defs>
        <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#F59E0B" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"    />
        </linearGradient>
      </defs>

      {/* Horizontal grid lines + y-axis labels */}
      {gridYs.map(v => (
        <g key={v}>
          <line
            x1={padL} y1={yScale(v).toFixed(1)}
            x2={W - padR} y2={yScale(v).toFixed(1)}
            stroke="#374151" strokeWidth="0.5" strokeDasharray="4 3"
          />
          <text
            x={padL - 5} y={yScale(v) + 3.5}
            textAnchor="end" fontSize="9" fill="#4B5563" fontFamily="ui-monospace,monospace"
          >
            {v}%
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#retGrad)" />

      {/* Retention line */}
      <path
        d={linePath}
        fill="none"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* First point dot */}
      <circle cx={pathPts[0].x} cy={pathPts[0].y} r="3" fill="#F59E0B" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// GeoList — top countries
// ─────────────────────────────────────────────────────────────────────────

const COUNTRY_NAMES = {
  IN:'India', US:'United States', GB:'United Kingdom', DE:'Germany', FR:'France',
  CA:'Canada', AU:'Australia', BR:'Brazil', SG:'Singapore', AE:'UAE',
  NL:'Netherlands', JP:'Japan', NZ:'New Zealand', PK:'Pakistan', BD:'Bangladesh',
};

function GeoList({ countries }) {
  const max = countries[0]?.count || 1;
  return (
    <div className="flex flex-col gap-3">
      {countries.map(c => {
        const pct  = Math.round((c.count / max) * 100);
        const name = COUNTRY_NAMES[c.country] ?? c.country;
        return (
          <div key={c.country} className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold text-gray-400 w-6 flex-shrink-0">
              {c.country}
            </span>
            <div className="flex-1 relative h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-amber-400/60 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-300 tabular-nums w-6 text-right flex-shrink-0">
              {c.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// OverviewPromoRow
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
  const totalViewers  = (video.total_viewers  ?? 0).toLocaleString();
  const uniqueViewers = (video.unique_session_viewers ?? video.unique_viewers ?? 0).toLocaleString();

  return (
    <div className="bg-gray-800 border border-amber-500/25 rounded-xl hover:border-amber-500/50 transition-colors">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onClick}
          className="flex-shrink-0 relative w-24 h-14 rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden group/thumb"
        >
          {video.thumbnail_url
            ? <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
            : <VideoThumbIcon />
          }
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-lg select-none">▶︎</span>
          </div>
          {duration && (
            <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] font-medium px-1 py-0.5 rounded leading-none pointer-events-none">
              {duration}
            </span>
          )}
        </button>

        <button onClick={onClick} className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-gray-100 truncate">{video.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{sourceLabel}</p>
        </button>

        <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
          <OvStatCol label="Total Plays"    value={totalViewers}  />
          <OvStatCol label="Unique Viewers" value={uniqueViewers} />
        </div>

        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400/50 flex-shrink-0 ml-2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>
    </div>
  );
}

function OvStatCol({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-gray-200 mt-0.5">{value}</p>
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
      <span className="text-[11px] font-bold text-gray-600 w-4 text-center flex-shrink-0">{rank}</span>

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
        <MiniStat label="Plays"    value={(video.total_plays    ?? 0).toLocaleString()} />
        <MiniStat label="Viewers"  value={(video.unique_viewers ?? 0).toLocaleString()} />
        <MiniStat label="Avg Watch" value={`${parseFloat(video.avg_watch_pct ?? 0).toFixed(0)}%`} />
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
// SectionLabel
// ─────────────────────────────────────────────────────────────────────────

function SectionLabel({ text, icon, color = 'gray', className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {icon && (
        <span className={`text-xs ${color === 'amber' ? 'text-amber-400' : 'text-gray-500'}`}>{icon}</span>
      )}
      <span className={`text-[11px] font-bold uppercase tracking-widest
                        ${color === 'amber' ? 'text-amber-400' : 'text-gray-400'}`}>
        {text}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EmptyOverview
// ─────────────────────────────────────────────────────────────────────────

function EmptyOverview() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20
                        flex items-center justify-center mx-auto mb-5">
          <span className="text-amber-500 text-2xl select-none">▶︎</span>
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

// ─────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="bg-gray-800/50 border border-gray-700/40 rounded-2xl p-4 h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-800/50 border border-gray-700/40 rounded-2xl h-48" />
        <div className="bg-gray-800/50 border border-gray-700/40 rounded-2xl h-48" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function TrendingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function ClockIcon({ className = 'w-full h-full' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ArrowUpIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ArrowDownIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function VideoThumbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" className="text-gray-500">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 flex-shrink-0">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
