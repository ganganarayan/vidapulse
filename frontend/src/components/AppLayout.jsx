'use strict';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth }             from '../contexts/AuthContext';
import { ThemeToggle }         from '../contexts/ThemeContext';
import { useToast }            from '../contexts/ToastContext';
import { useUpgrade }          from '../contexts/UpgradeContext';
import { useWebhookAlerts }    from '../hooks/useWebhookAlerts';
import ExpiryReminderBanner    from './ExpiryReminderBanner';
import api                     from '../lib/api';
import { getLockColor }        from './PlanTierBadge';

/**
 * AppLayout — persistent left sidebar + content area.
 * On mobile the sidebar becomes a hamburger-triggered drawer overlay.
 * Used by all authenticated pages EXCEPT VideoDetail (which uses VideoLayout).
 */
export default function AppLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* ── Mobile drawer backdrop ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Sidebar — hidden on mobile unless drawer open ── */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-56 flex-shrink-0
        transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0 md:z-auto
        ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AppSidebar onClose={() => setDrawerOpen(false)} />
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Mobile top bar with hamburger */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900 flex-shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 -ml-1"
            aria-label="Open menu"
          >
            <HamburgerIcon />
          </button>
          <Link to="/dashboard" className="flex items-center gap-1.5">
            <span className="text-amber-500 text-lg leading-none select-none">{'▶︎'}</span>
            <span className="text-sm font-bold text-amber-500 tracking-tight">VidaPulse</span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <ExpiryReminderBanner />
        {children}
        <div className="flex-shrink-0 border-t border-gray-800/60 px-4 py-2 text-center">
          <p className="text-[11px] text-gray-400">
            Need help?{' '}
            <a href="mailto:support@vidapulse.io"
               className="text-gray-500 hover:text-gray-400 transition-colors">
              support@vidapulse.io
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AppSidebar — global nav (no video context)
// ─────────────────────────────────────────────────────────────────────────

function AppSidebar({ onClose }) {
  const { user, isImpersonating } = useAuth();
  const { showUpgrade }           = useUpgrade();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [signingOut, setSigningOut] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.plan === 'admin_lifetime';

  // Poll webhook alert status for admins
  const webhookAlerts = useWebhookAlerts({ enabled: isAdmin });
  const prevPausedRef  = useRef(null);
  useEffect(() => {
    if (webhookAlerts.loading) return;
    const isNewPause = prevPausedRef.current === false && webhookAlerts.paused;
    if (isNewPause) {
      showToast(
        `⚠ Contact webhook paused — ${webhookAlerts.queuedCount} event${webhookAlerts.queuedCount !== 1 ? 's' : ''} queued`,
        'error'
      );
    }
    prevPausedRef.current = webhookAlerts.paused;
  }, [webhookAlerts.paused, webhookAlerts.queuedCount, webhookAlerts.loading, showToast]);

  async function handleSignOut() {
    setSigningOut(true);
    try { await api.post('/auth/logout'); } catch (_) {}
    navigate('/login', { replace: true });
  }

  function active(path, exact = false) {
    return exact
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(path + '/');
  }

  return (
    <aside className="w-56 h-full border-r border-gray-800 flex flex-col bg-gray-900">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <span className="text-amber-500 text-xl leading-none select-none">{'▶︎'}</span>
          <span className="text-base font-bold text-amber-500 tracking-tight">VidaPulse</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden ml-1 text-gray-500 hover:text-gray-300 transition-colors p-1"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <SidebarItem to="/dashboard" icon={<GridIcon />}    label="Overview" active={active('/dashboard', true)} />
        <SidebarItem to="/videos"    icon={<VideoIcon />}  label="Videos"   active={active('/videos')} />
        <SidebarItem to="/audience"  icon={<AudienceIcon />} label="Audience" active={active('/audience', true)} />

        <SidebarDivider label="Analytics" />
        <SidebarItem to="/events"       icon={<EventsIcon />}  label="Events"       active={active('/events')}       plan="pro" userPlan={user?.plan} />
        <SidebarItem to="/funnels"      icon={<FunnelIcon />}  label="Funnels"      active={active('/funnels')}      plan="pro" userPlan={user?.plan} />
        <SidebarItem to="/cta-tracking" icon={<CtaIcon />}     label="CTA Tracking" active={active('/cta-tracking')} plan="pro" userPlan={user?.plan} />
        <SidebarItem to="/reports"      icon={<ReportsIcon />} label="Reports"      active={active('/reports')}      plan="pro" userPlan={user?.plan} />
        <SidebarItem to="/alerts"       icon={<BellIcon />}    label="Alerts"       active={active('/alerts')}       plan="pro" userPlan={user?.plan} />

        <SidebarDivider label="Account" />
        <SidebarItem to="/account"       icon={<SettingsIcon />}     label="Settings"       active={active('/account', true)} />
        <SidebarItem to="/billing"       icon={<BillingIcon />}      label="Billing"        active={active('/billing', true)} />
        <SidebarItem to="/integrations"  icon={<IntegrationsIcon />} label="Integrations"   active={active('/integrations')} />
        <SidebarItem to="/help"          icon={<HelpIcon />}         label="Help & Support" active={active('/help')} />

        {/* Upgrade CTA */}
        {user && (user.plan === 'free' || user.plan === 'starter') && (
          <button
            onClick={() => showUpgrade(user.plan === 'free' ? 'starter' : 'pro')}
            className="mt-2 flex items-center justify-between gap-2 px-3 py-2 rounded-lg
                       text-xs font-semibold transition-colors w-full text-left
                       bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
          >
            <span className="flex items-center gap-1.5">
              <UpgradeIcon />
              {user.plan === 'free' ? 'Upgrade plan' : 'Upgrade to Pro'}
            </span>
            <span className="text-amber-500/70">→</span>
          </button>
        )}

        {isAdmin && (
          <>
            <SidebarDivider label="Admin" />
            <SidebarItem to="/admin/users"       icon={<UsersIcon />}    label="Users"        active={active('/admin/users')} />
            <SidebarItem to="/admin/revenue"     icon={<RevenueIcon />}  label="Revenue"      active={active('/admin/revenue')} />
            <SidebarItem to="/admin/promotion"   icon={<StarIcon />}     label="Promotion"    active={active('/admin/promotion')} />
            <SidebarItem to="/admin/webhook"     icon={<WebhookIcon />}  label="Webhook"      active={active('/admin/webhook', true)} />
            <SidebarItem
              to="/admin/webhook-log"
              icon={<LogIcon />}
              label="Webhook Log"
              active={active('/admin/webhook-log')}
              badge={webhookAlerts.paused ? (webhookAlerts.queuedCount || '!') : null}
            />
            <SidebarItem to="/admin/help"        icon={<HelpIcon />}     label="Help Editor"  active={active('/admin/help')} />
            <SidebarItem to="/admin/onboarding"  icon={<HeartIcon />}    label="Onboarding"   active={active('/admin/onboarding')} />
            <SidebarItem to="/admin/copy-data"   icon={<CopyDataIcon />} label="Copy Data"    active={active('/admin/copy-data')} />
          </>
        )}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-gray-800">
        {user && (
          <div className="flex flex-col gap-1">
            <PlanChip plan={user.plan} displayName={user.plan_display_name} />
            <p className="text-xs font-medium text-gray-200 truncate mt-1">
              {isImpersonating ? '(Admin view)' : (user.name || user.email)}
            </p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
            <button onClick={handleSignOut} disabled={signingOut}
              className="mt-2 text-left text-xs text-gray-400 hover:text-red-400 transition-colors">
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// VideoSidebar — video-context left panel shown in VideoDetail
// ─────────────────────────────────────────────────────────────────────────

export function VideoSidebar({ video, activeView, onViewChange, user, drawerOpen, onClose }) {
  const navigate       = useNavigate();
  const isAdmin        = user?.role === 'admin' || user?.plan === 'admin_lifetime';
  const isPro          = ['pro','admin_lifetime'].includes(user?.plan);
  const isStarter      = ['starter','pro','admin_lifetime'].includes(user?.plan);
  // Promotion videos are owned by an admin. Non-owners (incl. starter/pro)
  // may only view analytics — editing settings / grabbing embed is blocked.
  const isPromo        = !!video?.is_promo;
  const { isImpersonating } = useAuth();
  const { showUpgrade }     = useUpgrade();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try { await api.post('/auth/logout'); } catch (_) {}
    navigate('/login', { replace: true });
  }

  function navItem(view, icon, label, locked = false, requiredPlan = null, disabled = false, disabledTitle = '') {
    const isActive = activeView === view;
    return (
      <button
        key={view}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (locked) { showUpgrade(requiredPlan); return; }
          onViewChange(view);
          if (onClose) onClose();
        }}
        title={disabled ? disabledTitle : locked ? `Upgrade to ${requiredPlan} to access` : label}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left
          ${isActive
            ? 'bg-amber-500/15 text-amber-400'
            : disabled
              ? 'text-gray-600 cursor-not-allowed opacity-50'
              : locked
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
      >
        <span className="flex-shrink-0 w-4 h-4">{icon}</span>
        <span className="flex-1 truncate">{label}</span>
        {disabled
          ? <LockIcon color="#6b7280" />
          : locked && <LockIcon color={getLockColor(requiredPlan)} />}
      </button>
    );
  }

  return (
    <aside className="w-56 h-full border-r border-gray-800 flex flex-col bg-gray-900">
      {/* Logo / back */}
      <div className="px-4 py-4 border-b border-gray-800 flex items-center gap-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
          title="All videos"
        >
          <BackIcon />
        </button>
        <Link to="/dashboard" className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-amber-500 text-lg leading-none select-none flex-shrink-0">{'▶︎'}</span>
          <span className="text-sm font-bold text-amber-500 tracking-tight truncate">VidaPulse</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle className="flex-shrink-0" />
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-gray-500 hover:text-gray-300 transition-colors p-1"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      {/* Video title */}
      {video && (
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Video</p>
          <p className="text-sm font-semibold text-gray-200 truncate" title={video.title}>
            {video.title}
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItem('overview',    <GridIcon />,    'Overview')}

        <SidebarDivider label="Metrics" />
        {navItem('total_views',   <PlaysIcon />,    'Total Page Views')}
        {navItem('unique_views',  <ViewersIcon />,  'Unique Page Views', !isStarter, 'starter')}
        {navItem('plays',         <PlaysIcon />,    'Total Plays')}
        {navItem('viewers',       <ViewersIcon />,  'Unique Viewers')}
        {navItem('avg_watch',   <WatchIcon />,   'Avg. Watch %',   !isStarter, 'starter')}
        {navItem('play_rate',   <PlayRateIcon />,'Play Rate')}
        {navItem('completion',  <CheckIcon />,   'Completion Rate', !isStarter, 'starter')}
        {navItem('dropoff',     <DropoffIcon />, 'Drop-off Rate',   !isPro,     'pro')}
        {navItem('watch_time',  <ClockIcon />,   'Watch Time',      !isStarter, 'starter')}
        {navItem('rewatches',   <RepeatIcon />,  'Re-watches',      !isPro,     'pro')}
        {navItem('domains',     <DomainIcon />,  'Domains')}

        <SidebarDivider label="Engagement" />
        {navItem('heatmap',     <HeatmapIcon />, 'Engagement Heatmap', !isPro,     'pro')}
        {navItem('stories',     <StoriesIcon />, 'Viewer Stories',     !isStarter, 'starter')}
        {navItem('insights',    <SparklesIcon />,'Insights',           !isPro,     'pro')}

        <SidebarDivider label="Audience" />
        {navItem('geography',   <GlobeIcon />,   'Geography',     !isStarter, 'starter')}
        {navItem('devices',     <DeviceIcon />,  'Devices',       !isStarter, 'starter')}
        {navItem('browsers',    <BrowserIcon />, 'Browsers',      !isStarter, 'starter')}
        {navItem('traffic',     <UTMIcon />,     'Traffic Sources', !isPro,     'pro')}

        <SidebarDivider label="Settings" />
        {navItem('embed',       <EmbedIcon />,   'Share & Embed',   false, null, isPromo && !isAdmin, 'Not available for promotion videos')}
        {navItem('player',      <PlayerIcon />,  'Player Settings', false, null, isPromo && !isAdmin, 'Not available for promotion videos')}
      </nav>

      {/* User section */}
      <div className="px-4 py-3 border-t border-gray-800">
        {user && (
          <div className="flex flex-col gap-1">
            <PlanChip plan={user.plan} displayName={user.plan_display_name} />
            <p className="text-xs text-gray-400 truncate mt-1">
              {isImpersonating ? '(Admin view)' : (user.name || user.email)}
            </p>
            <button onClick={handleSignOut} disabled={signingOut}
              className="mt-1 text-left text-xs text-gray-400 hover:text-red-400 transition-colors">
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────

function SidebarItem({ to, icon, label, active, coming = false, badge = null, plan = null, userPlan = null }) {
  const cls = `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
    ${active
      ? 'bg-amber-500/15 text-amber-400'
      : coming
        ? 'text-gray-500 cursor-default'
        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
    }`;
  const inner = (
    <>
      <span className="flex-shrink-0 w-4 h-4">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge != null && (
        <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white
                         text-[10px] font-bold flex items-center justify-center leading-none">
          {badge}
        </span>
      )}
    </>
  );
  if (coming || to === '#') {
    return (
      <button className={cls} disabled={coming} title={coming ? 'Coming soon' : label}>
        {inner}
      </button>
    );
  }
  return (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  );
}

function SidebarDivider({ label }) {
  return (
    <div className="mt-4 mb-1.5 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
      {label}
    </div>
  );
}

function PlanChip({ plan, displayName }) {
  const classes = {
    free          : 'bg-gray-700/60 text-gray-300 border-gray-600',
    starter       : 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    pro           : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    admin_lifetime: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium border rounded-full ${classes[plan] ?? classes.free}`}>
      {displayName ?? plan}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────

const I = (paths) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function GridIcon()         { return I(<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>); }
function AudienceIcon()     { return I(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>); }
function VideoIcon()        { return I(<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>); }
function FunnelIcon()       { return I(<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>); }
function CtaIcon()          { return I(<><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></>); }
function EventsIcon()       { return I(<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>); }
function ReportsIcon()      { return I(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>); }
function BellIcon()         { return I(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>); }
function SettingsIcon()     { return I(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>); }
function IntegrationsIcon() { return I(<><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></>); }
function HelpIcon()         { return I(<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>); }
function UsersIcon()        { return I(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>); }
function WebhookIcon()      { return I(<path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 18 8a3 3 0 1 0 0-6 3 3 0 0 0-3 3c0 .24.04.47.09.7L8.04 9.81A3 3 0 0 0 6 9a3 3 0 1 0 0 6 3 3 0 0 0 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a3 3 0 1 0 3-3z"/>); }
function HeartIcon()        { return I(<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>); }
function LogIcon()          { return I(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></>); }
function StarIcon()         { return I(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>); }
function RevenueIcon()      { return I(<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>); }
function UpgradeIcon()      { return I(<><polyline points="17 11 12 6 7 11"/><line x1="12" y1="6" x2="12" y2="18"/></>); }
function BillingIcon()      { return I(<><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>); }
function BackIcon()         { return I(<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>); }
function LockIcon({ color = '#F59E0B' }) { return (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>); }
function HeatmapIcon()      { return I(<><rect x="3" y="3" width="4" height="4" rx="1"/><rect x="10" y="3" width="4" height="4" rx="1"/><rect x="17" y="3" width="4" height="4" rx="1"/><rect x="3" y="10" width="4" height="4" rx="1"/><rect x="10" y="10" width="4" height="4" rx="1"/><rect x="17" y="10" width="4" height="4" rx="1"/><rect x="3" y="17" width="4" height="4" rx="1"/><rect x="10" y="17" width="4" height="4" rx="1"/><rect x="17" y="17" width="4" height="4" rx="1"/></>); }

// Video-context metric icons
function PlaysIcon()    { return I(<><polygon points="5 3 19 12 5 21 5 3"/></>); }
function ViewersIcon()  { return I(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>); }
function WatchIcon()    { return I(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>); }
function PlayRateIcon() { return I(<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>); }
function CheckIcon()    { return I(<><polyline points="20 6 9 17 4 12"/></>); }
function DropoffIcon()  { return I(<><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>); }
function ClockIcon()    { return I(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>); }
function RepeatIcon()   { return I(<><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>); }
function SparklesIcon() { return I(<><path d="M12 3l1.88 5.76L20 10l-6.12 1.24L12 17l-1.88-5.76L4 10l6.12-1.24L12 3z"/></>); }
function StoriesIcon()  { return I(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>); }
function GlobeIcon()    { return I(<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>); }
function DeviceIcon()   { return I(<><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>); }
function BrowserIcon()  { return I(<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>); }
function UTMIcon()      { return I(<><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 18 8a3 3 0 1 0 0-6 3 3 0 0 0-3 3c0 .24.04.47.09.7L8.04 9.81A3 3 0 0 0 6 9a3 3 0 1 0 0 6 3 3 0 0 0 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a3 3 0 1 0 3-3z"/></>); }
function EmbedIcon()    { return I(<><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>); }
function PlayerIcon()   { return I(<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>); }
function DomainIcon()   { return I(<><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>); }
function CopyDataIcon() { return I(<><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>); }
